import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { readFileSync } from 'fs';

/**
 * Prepares the full bytecode (contract bytecode + encoded constructor args)
 * for deployment
 */

// Read the compiled bytecode
const bytecodeHex = readFileSync('erc20_ezusd_sol_ezUSD.bin', 'utf-8').trim();

// Constructor parameters: (string _name, string _symbol, uint8 _decimals, uint256 _totalSupply, string _logoURI)
const constructorArgs: readonly [string, string, number, bigint, string] = [
    "ezUSD",      // name
    "ezUSD",      // symbol
    6,            // decimals
    BigInt(1000000000) * BigInt(10 ** 6), // totalSupply: 1 billion tokens (1000000000000000)
    "https://ezusd.gongxifacai.win/ezusd.png" // logoURI
];

// Encode constructor parameters
const encodedArgs = encodeAbiParameters(
    parseAbiParameters('string, string, uint8, uint256, string'),
    constructorArgs
);

// Combine bytecode + encoded constructor args
const fullBytecode = `0x${bytecodeHex}${encodedArgs.slice(2)}`;

console.log('Contract bytecode length:', bytecodeHex.length / 2, 'bytes');
console.log('Encoded constructor args length:', encodedArgs.slice(2).length / 2, 'bytes');
console.log('Full bytecode length:', fullBytecode.length / 2 - 1, 'bytes');
console.log('\n✅ Full bytecode ready for deployment:');
console.log(fullBytecode);
console.log('\nTo deploy, set BYTECODE environment variable:');
console.log(`export BYTECODE="${fullBytecode}"`);

