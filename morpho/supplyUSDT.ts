import { MarketParams, type MarketId } from "@morpho-org/blue-sdk";
import "@morpho-org/blue-sdk-viem/lib/augment/MarketParams";
import { walletClient, account } from "../init.ts";
import { createPublicClient, http, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { blueAbi } from "@morpho-org/blue-sdk-viem";

const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
    throw new Error("RPC_URL is not set");
}

const USDT_CONTRACT = process.env.USDT_CONTRACT as `0x${string}`;
if (!USDT_CONTRACT) {
    throw new Error("USDT_CONTRACT is not set");
}

const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb" as const;

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
});

const marketId = process.env.MORPHO_MARKET_ID as MarketId;

async function supplyUSDT() {
    if (!marketId) {
        throw new Error("MORPHO_MARKET_ID is not set");
    }

    console.log("Fetching market config for marketId:", marketId);
    
    // Fetch market config to get market params
    const marketConfig = await MarketParams.fetch(marketId, publicClient);
    
    console.log("Loan Token:", marketConfig.loanToken);
    console.log("Collateral Token:", marketConfig.collateralToken);
    
    // Verify that USDT matches the loan token
    if (marketConfig.loanToken.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
        throw new Error(`USDT contract ${USDT_CONTRACT} does not match market loan token ${marketConfig.loanToken}`);
    }
    
    // USDT has 6 decimals, so 5 USDT = 5 * 10^6
    const amount = parseUnits("5", 6);
    
    console.log("Supplying", amount.toString(), "units of USDT (5 USDT)");
    
    // ERC20 ABI for approve, allowance, and decimals
    const erc20Abi = [
        {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
        },
        {
            name: "allowance",
            type: "function",
            stateMutability: "view",
            inputs: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
            ],
            outputs: [{ name: "", type: "uint256" }],
        },
        {
            name: "decimals",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ name: "", type: "uint8" }],
        },
        {
            name: "balanceOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
        },
    ] as const;
    
    // Check USDT balance
    const balance = await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
    });
    
    console.log("USDT balance:", balance.toString());
    
    if (balance < amount) {
        throw new Error(`Insufficient USDT balance. Have ${balance.toString()}, need ${amount.toString()}`);
    }
    
    // Check current allowance
    const currentAllowance = await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account.address, MORPHO_BLUE_ADDRESS],
    });
    
    console.log("Current allowance:", currentAllowance.toString());
    
    // Approve if needed
    if (currentAllowance < amount) {
        console.log("Approving USDT...");
        const approveHash = await walletClient.writeContract({
            address: USDT_CONTRACT,
            abi: erc20Abi,
            functionName: "approve",
            args: [MORPHO_BLUE_ADDRESS, amount],
        });
        
        console.log("Approve transaction hash:", approveHash);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log("Approval confirmed");
    }
    
    // Prepare market params for the supply call
    const marketParams = {
        loanToken: marketConfig.loanToken,
        collateralToken: marketConfig.collateralToken,
        oracle: marketConfig.oracle,
        irm: marketConfig.irm,
        lltv: marketConfig.lltv,
    };
    
    // Supply USDT
    // In Morpho Blue, when supplying, you can pass:
    // - assets > 0 and shares = 0 (contract calculates shares)
    // - assets = 0 and shares > 0 (contract calculates assets)
    // We'll pass assets and 0 for shares, letting the contract calculate shares
    console.log("Supplying USDT to Morpho Blue...");
    const supplyHash = await walletClient.writeContract({
        address: MORPHO_BLUE_ADDRESS,
        abi: blueAbi,
        functionName: "supply",
        args: [marketParams, amount, 0n, account.address, "0x" as `0x${string}`],
    });
    
    console.log("Supply transaction hash:", supplyHash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: supplyHash });
    console.log("✅ USDT supplied successfully!");
    console.log("Transaction receipt:", receipt);
    
    return receipt;
}

// Run if executed directly
if (import.meta.main) {
    supplyUSDT().catch(console.error);
}

export { supplyUSDT };

