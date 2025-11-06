// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ezusd.sol";

/**
 * @title DeployEZUSD
 * @dev Deployment script for ezUSD with ezusd.png logo
 * 
 * Logo is hosted at: https://ezusd.gongxifacai.win/ezusd.png
 */
contract DeployEZUSD {
    function deploy() public returns (ezUSD) {
        return new ezUSD(
            "ezUSD",                // name
            "ezUSD",                // symbol
            6,                      // decimals
            1000000000 * 10**6,     // totalSupply: 1 billion tokens
            "https://ezusd.gongxifacai.win/ezusd.png"  // logoURI
        );
    }
}

