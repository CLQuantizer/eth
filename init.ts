import { mainnet } from 'viem/chains';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set");
}

// Ensure private key has 0x prefix
const formattedPrivateKey = PRIVATE_KEY.startsWith('0x') 
    ? PRIVATE_KEY as `0x${string}`
    : (`0x${PRIVATE_KEY}` as `0x${string}`);

const account = privateKeyToAccount(formattedPrivateKey);

const RPC_URL = process.env.RPC_URL;

if (!RPC_URL) {
    throw new Error("RPC_URL is not set");
}

const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(RPC_URL),
});

export { PRIVATE_KEY, walletClient, account, mainnet as chain };