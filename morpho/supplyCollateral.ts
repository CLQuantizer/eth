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

const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb" as const;

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
});

const marketId = process.env.MORPHO_MARKET_ID as MarketId;

async function supplyCollateral() {
    if (!marketId) {
        throw new Error("MORPHO_MARKET_ID is not set");
    }

    console.log("Fetching market config for marketId:", marketId);
    
    // Fetch market config to get collateral token and market params
    const marketConfig = await MarketParams.fetch(marketId, publicClient);
    const collateralToken = marketConfig.collateralToken;
    
    console.log("Collateral Token:", collateralToken);
    console.log("Loan Token:", marketConfig.loanToken);
    
    // Amount to supply: 1000 tokens
    // We need to get the token decimals to properly format the amount
    // For now, assuming 18 decimals (standard ERC20), but we should fetch it
    const amount = parseUnits("1000", 18); // 1000 tokens with 18 decimals
    
    console.log("Supplying", amount.toString(), "units of collateral");
    
    // First, check and approve the collateral token if needed
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
    ] as const;
    
    // Get token decimals
    const decimals = await publicClient.readContract({
        address: collateralToken,
        abi: erc20Abi,
        functionName: "decimals",
    });
    
    // Recalculate amount with correct decimals
    const correctAmount = parseUnits("1000", decimals);
    console.log("Corrected amount:", correctAmount.toString(), "with", decimals, "decimals");
    
    // Check current allowance
    const currentAllowance = await publicClient.readContract({
        address: collateralToken,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account.address, MORPHO_BLUE_ADDRESS],
    });
    
    console.log("Current allowance:", currentAllowance.toString());
    
    // Approve if needed
    if (currentAllowance < correctAmount) {
        console.log("Approving collateral token...");
        const approveHash = await walletClient.writeContract({
            address: collateralToken,
            abi: erc20Abi,
            functionName: "approve",
            args: [MORPHO_BLUE_ADDRESS, correctAmount],
        });
        
        console.log("Approve transaction hash:", approveHash);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log("Approval confirmed");
    }
    
    // Prepare market params for the supplyCollateral call
    const marketParams = {
        loanToken: marketConfig.loanToken,
        collateralToken: marketConfig.collateralToken,
        oracle: marketConfig.oracle,
        irm: marketConfig.irm,
        lltv: marketConfig.lltv,
    };
    
    // Supply collateral
    console.log("Supplying collateral to Morpho Blue...");
    const supplyHash = await walletClient.writeContract({
        address: MORPHO_BLUE_ADDRESS,
        abi: blueAbi,
        functionName: "supplyCollateral",
        args: [marketParams, correctAmount, account.address, "0x" as `0x${string}`],
    });
    
    console.log("Supply transaction hash:", supplyHash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: supplyHash });
    console.log("✅ Collateral supplied successfully!");
    console.log("Transaction receipt:", receipt);
    
    return receipt;
}

// Run if executed directly
if (import.meta.main) {
    supplyCollateral().catch(console.error);
}

export { supplyCollateral };

