import { MarketParams, type MarketId } from "@morpho-org/blue-sdk";
import "@morpho-org/blue-sdk-viem/lib/augment/MarketParams";
import "@morpho-org/blue-sdk-viem/lib/augment/Market";
import "@morpho-org/blue-sdk-viem/lib/augment/Position";
import { createClient, http } from "viem";
import { mainnet } from "viem/chains";
 
// Set up the client
const client = createClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL),
});

const marketId = process.env.MORPHO_MARKET_ID as MarketId;
 
async function fetchMarketConfig() {
  console.log("Fetching market config id=", marketId);
  const config = await MarketParams.fetch(marketId, client);
  console.log("Collateral Token:", config.collateralToken);
  console.log("Loan Token:", config.loanToken);
  console.log("LLTV:", config.lltv);
}

console.log(await fetchMarketConfig());