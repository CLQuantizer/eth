// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ezusd.sol";

/**
 * @title DeployEZUSD
 * @dev Deployment script for EZUSD with ezusd.png logo
 * 
 * Note: Replace the logoURI with the actual URL/IPFS hash where ezusd.png is hosted
 * Example IPFS: "ipfs://QmYourHashHere/ezusd.png"
 * Example HTTP: "https://yourdomain.com/assets/ezusd.png"
 */
contract DeployEZUSD {
    function deploy() public returns (ezUSD) {
        return new ezUSD(
            "EZUSD",                // name
            "EZUSD",                // symbol
            6,                      // decimals
            1000000000 * 10**6,     // totalSupply: 1 billion tokens
            "ipfs://QmYourHashHere/ezusd.png"  // logoURI - replace with actual IPFS hash or URL
        );
    }
}

