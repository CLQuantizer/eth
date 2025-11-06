import { MarketParams, type MarketId, Position, Market } from "@morpho-org/blue-sdk";
import "@morpho-org/blue-sdk-viem/lib/augment/MarketParams";
import "@morpho-org/blue-sdk-viem/lib/augment/Market";
import "@morpho-org/blue-sdk-viem/lib/augment/Position";
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

async function borrowUSDT() {
    const marketIdEnv = process.env.MORPHO_MARKET_ID;
    if (!marketIdEnv) {
        throw new Error("MORPHO_MARKET_ID is not set");
    }
    const marketId = marketIdEnv as `0x${string}` as MarketId;

    console.log("Fetching market config for marketId:", marketId);
    
    // Fetch market config to get market params
    const marketConfig = await MarketParams.fetch(marketId, publicClient);
    
    console.log("Loan Token:", marketConfig.loanToken);
    console.log("Collateral Token:", marketConfig.collateralToken);
    console.log("LLTV:", marketConfig.lltv.toString());
    
    // Verify that USDT matches the loan token
    if (marketConfig.loanToken.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
        throw new Error(`USDT contract ${USDT_CONTRACT} does not match market loan token ${marketConfig.loanToken}`);
    }
    
    // Fetch current position to check collateral
    console.log("Fetching current position...");
    const position = await Position.fetch(account.address, marketId, publicClient);
    
    console.log("Current collateral:", position.collateral.toString());
    console.log("Current borrow shares:", position.borrowShares.toString());
    
    // Fetch market to check borrowing capacity
    const market = await Market.fetch(marketId, publicClient);
    
    // Calculate current borrow assets if there's an existing position
    let currentBorrowAssets = 0n;
    if (position.borrowShares > 0n) {
        currentBorrowAssets = market.toBorrowAssets(position.borrowShares);
        console.log("Current borrow assets:", currentBorrowAssets.toString());
    }
    
    // Calculate max borrowable assets
    const maxBorrowAssets = market.getMaxBorrowAssets(position.collateral);
    if (!maxBorrowAssets) {
        throw new Error("Could not calculate max borrowable assets (oracle issue?)");
    }
    
    console.log("Max borrowable assets:", maxBorrowAssets.toString());
    
    // Amount to borrow: 2.5 USDT (2.5 * 10^6 = 2500000 units)
    const borrowAmount = parseUnits("2.5", 6);
    
    console.log("Requesting to borrow:", borrowAmount.toString(), "units of USDT (2.5 USDT)");
    
    // Check if we can borrow this amount
    const totalBorrowAfter = currentBorrowAssets + borrowAmount;
    if (totalBorrowAfter > maxBorrowAssets) {
        throw new Error(
            `Cannot borrow ${borrowAmount.toString()}. ` +
            `Max borrowable: ${maxBorrowAssets.toString()}, ` +
            `Current borrow: ${currentBorrowAssets.toString()}, ` +
            `Would exceed by: ${totalBorrowAfter - maxBorrowAssets}`
        );
    }
    
    // Calculate health factor after borrowing
    const newPosition = {
        collateral: position.collateral,
        borrowShares: market.toBorrowShares(totalBorrowAfter),
    };
    const healthFactor = market.getHealthFactor(newPosition);
    if (healthFactor !== undefined) {
        console.log("Health factor after borrow:", healthFactor.toString());
    }
    
    // Prepare market params for the borrow call
    const marketParams = {
        loanToken: marketConfig.loanToken,
        collateralToken: marketConfig.collateralToken,
        oracle: marketConfig.oracle,
        irm: marketConfig.irm,
        lltv: marketConfig.lltv,
    };
    
    // Borrow USDT
    // In Morpho Blue, when borrowing, you can pass:
    // - assets > 0 and shares = 0 (contract calculates shares)
    // - assets = 0 and shares > 0 (contract calculates assets)
    // We'll pass assets and 0 for shares, letting the contract calculate shares
    console.log("Borrowing USDT from Morpho Blue...");
    const borrowHash = await walletClient.writeContract({
        address: MORPHO_BLUE_ADDRESS,
        abi: blueAbi,
        functionName: "borrow",
        args: [marketParams, borrowAmount, 0n, account.address, account.address],
    });
    
    console.log("Borrow transaction hash:", borrowHash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: borrowHash });
    console.log("✅ USDT borrowed successfully!");
    console.log("Transaction receipt:", receipt);
    
    // Fetch updated position
    const updatedPosition = await Position.fetch(account.address, marketId, publicClient);
    const updatedBorrowAssets = updatedPosition.borrowShares > 0n 
        ? market.toBorrowAssets(updatedPosition.borrowShares)
        : 0n;
    
    console.log("Updated position:");
    console.log("  Collateral:", updatedPosition.collateral.toString());
    console.log("  Borrow shares:", updatedPosition.borrowShares.toString());
    console.log("  Borrow assets:", updatedBorrowAssets.toString());
    
    return receipt;
}

// Run if executed directly
if (import.meta.main) {
    borrowUSDT().catch(console.error);
}

export { borrowUSDT };

