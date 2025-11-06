// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ezusd.sol";

/**
 * @title DeployEZUSD
 * @dev Deployment script for EZUSD with ezusd.png logo
 * 
 * Logo is hosted at: https://ezusd.gongxifacai.win/ezusd.png
 */
contract DeployEZUSD {
    function deploy() public returns (ezUSD) {
        return new ezUSD(
            "EZUSD",                // name
            "EZUSD",                // symbol
            6,                      // decimals
            1000000000 * 10**6,     // totalSupply: 1 billion tokens
            "https://ezusd.gongxifacai.win/ezusd.png"  // logoURI
        );
    }
}

