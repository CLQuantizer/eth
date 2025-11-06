import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

/**
 * Generates a new Ethereum key pair and logs it to the console
 * 
 * Usage:
 *   bun run secrets/key_gen.ts
 */
function generateKeyPair() {
    console.log('Generating Ethereum key pair...\n');
    
    // Generate a random private key
    const privateKey = generatePrivateKey();
    
    // Derive the account (address/public key) from the private key
    const account = privateKeyToAccount(privateKey);
    
    console.log('✅ Key pair generated successfully!\n');
    console.log('Private Key:', privateKey);
    console.log('Address:', account.address);
    console.log('\n⚠️  WARNING: Keep your private key secure and never share it!');
    
    return {
        privateKey,
        address: account.address,
    };
}

// Run if executed directly
if (import.meta.main) {
    generateKeyPair();
}

