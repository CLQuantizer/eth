import { walletClient, account } from '../init.ts';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { readFileSync } from 'fs';
import { join } from 'path';

const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
    throw new Error("RPC_URL is not set");
}

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
});

// Contract addresses
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const EZUSD_ADDRESS = '0x77b80f4ac4c6cbb4982689749177349cf1635115';
const CONTROLLER_ADDRESS = process.env.CONTROLLER_ADDRESS || account.address;

/**
 * Deploy Convert contract
 * 
 * To compile the contract:
 *   solcjs --bin --abi convert/Convert.sol -o convert/
 * 
 * This will generate convert_Convert_sol_Convert.bin and convert_Convert_sol_Convert.abi
 */
async function deployConvert() {
    // Read compiled bytecode (solcjs naming: convert_Convert_sol_Convert.bin)
    const bytecodePath = join(process.cwd(), 'convert', 'convert_Convert_sol_Convert.bin');
    let bytecodeHex: string;
    
    try {
        bytecodeHex = readFileSync(bytecodePath, 'utf-8').trim();
    } catch (error) {
        throw new Error(
            `Failed to read bytecode file at ${bytecodePath}. ` +
            `Please compile the contract first: solcjs --bin --abi convert/Convert.sol -o convert/`
        );
    }
    
    // Constructor parameters: (address _usdt, address _ezusd, address _controller)
    const constructorArgs: readonly [`0x${string}`, `0x${string}`, `0x${string}`] = [
        USDT_ADDRESS as `0x${string}`,
        EZUSD_ADDRESS as `0x${string}`,
        CONTROLLER_ADDRESS as `0x${string}`
    ];
    
    // Encode constructor parameters
    const encodedArgs = encodeAbiParameters(
        parseAbiParameters('address, address, address'),
        constructorArgs
    );
    
    // Combine bytecode + encoded constructor args
    const fullBytecode = `0x${bytecodeHex}${encodedArgs.slice(2)}` as `0x${string}`;
    
    console.log('Deploying Convert contract...');
    console.log('Deployer address:', account.address);
    console.log('USDT address:', USDT_ADDRESS);
    console.log('ezUSD address:', EZUSD_ADDRESS);
    console.log('Controller address:', CONTROLLER_ADDRESS);
    console.log('Chain:', mainnet.name);
    console.log('Bytecode length:', fullBytecode.length - 2, 'characters');
    
    try {
        // Get gas price
        const gasPrice = await publicClient.getGasPrice();
        
        // Get nonce
        const nonce = await publicClient.getTransactionCount({ 
            address: account.address 
        });
        
        // Estimate gas
        const gasEstimate = await publicClient.estimateGas({
            account,
            data: fullBytecode,
        });
        
        console.log('Estimated gas:', gasEstimate.toString());
        
        // Send raw transaction with bytecode
        const hash = await walletClient.sendTransaction({
            to: undefined, // undefined means contract creation
            data: fullBytecode,
            gas: gasEstimate,
            gasPrice: gasPrice,
            nonce: nonce,
        });
        
        console.log('Transaction hash:', hash);
        console.log('Waiting for confirmation...');
        
        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (!receipt.contractAddress) {
            throw new Error('Contract deployment failed - no contract address in receipt');
        }
        
        console.log('✅ Contract deployed successfully!');
        console.log('Contract address:', receipt.contractAddress);
        console.log('Block number:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());
        console.log('\n📝 Add this to your environment:');
        console.log(`CONVERT_CONTRACT=${receipt.contractAddress}`);
        console.log(`CONTROLLER_ADDRESS=${CONTROLLER_ADDRESS}`);
        
        return receipt.contractAddress;
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment if this file is executed directly
if (import.meta.main) {
    deployConvert().catch(console.error);
}

export { deployConvert };
