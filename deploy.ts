import { walletClient, account } from './init.ts';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
    throw new Error("RPC_URL is not set");
}

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
});

/**
 * Deploy ezUSD contract using raw Solidity bytecode
 * 
 * Compile your contract first:
 *   solc --bin --abi erc20/ezusd.sol
 * 
 * Then get the full bytecode with constructor args already encoded.
 * You can use solc with constructor args:
 *   solc --bin erc20/ezusd.sol | xargs -I {} cast abi-encode "constructor(string,string,uint8,uint256,string)" "ezUSD" "ezUSD" 6 1000000000000000 "https://ezusd.gongxifacai.win/ezusd.png"
 * 
 * Or use Remix to compile and get the full bytecode ready to deploy.
 */
async function deployEZUSD() {
    // Replace with your FULL compiled bytecode (including constructor args)
    // This should be the bytecode + encoded constructor parameters concatenated
    // Format: <bytecode> + <encoded_constructor_args>
    const FULL_BYTECODE = process.env.BYTECODE || '0x';
    
    if (FULL_BYTECODE === '0x' || FULL_BYTECODE.length < 10) {
        throw new Error('BYTECODE environment variable not set or invalid. Please provide the full compiled bytecode.');
    }
    
    // Ensure it starts with 0x
    const bytecode = FULL_BYTECODE.startsWith('0x') 
        ? FULL_BYTECODE as `0x${string}`
        : (`0x${FULL_BYTECODE}` as `0x${string}`);
    
    console.log('Deploying ezUSD contract...');
    console.log('Deployer address:', account.address);
    console.log('Chain:', mainnet.name);
    console.log('Bytecode length:', bytecode.length - 2, 'characters');
    
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
            data: bytecode,
        });
        
        console.log('Estimated gas:', gasEstimate.toString());
        
        // Send raw transaction with bytecode
        const hash = await walletClient.sendTransaction({
            to: undefined, // undefined means contract creation
            data: bytecode,
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
        
        return receipt.contractAddress;
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment if this file is executed directly
if (import.meta.main) {
    deployEZUSD().catch(console.error);
}

export { deployEZUSD };

