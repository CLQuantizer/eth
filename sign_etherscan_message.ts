import { walletClient, account } from './init.ts';

/**
 * Signs the Etherscan verification message
 * 
 * Usage:
 *   bun run sign_etherscan_message.ts
 */
async function signEtherscanMessage() {
    const message = "[Etherscan.io 06/11/2025 12:17:53] I, hereby verify that I am the owner/creator of the address [0x77b80f4ac4c6cbb4982689749177349cf1635115]";
    
    console.log('Signing message for Etherscan verification...');
    console.log('Account address:', account.address);
    console.log('\nMessage to sign:');
    console.log(message);
    console.log('\nSigning...\n');
    
    try {
        // Sign the message using walletClient
        const signature = await walletClient.signMessage({
            account,
            message,
        });
        
        console.log('✅ Signature generated successfully!');
        console.log('\n📝 Signature (hash):');
        console.log(signature);
        console.log('\n💡 Copy this signature and paste it on Etherscan to verify ownership.');
        
        return signature;
    } catch (error) {
        console.error('❌ Failed to sign message:', error);
        throw error;
    }
}

// Run if executed directly
if (import.meta.main) {
    signEtherscanMessage().catch(console.error);
}

export { signEtherscanMessage };

