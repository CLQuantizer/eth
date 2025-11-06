// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title ezUSD
 * @dev ERC20 Token with logo support
 * 
 * Compiled with: solcjs 0.8.30
 * 
 * Etherscan Verification Settings:
 * - Compiler Version: 0.8.30
 * - Optimization: No (try "Yes" with 200 runs if verification fails)
 * - EVM Version: default
 * 
 * Constructor parameters used for deployment:
 * - name: "ezUSD"
 * - symbol: "ezUSD"
 * - decimals: 6
 * - totalSupply: 1000000000000000 (1 billion tokens)
 * - logoURI: "https://ezusd.gongxifacai.win/ezusd.png"
 * 
 * Constructor Arguments (ABI-encoded):
 * Use the encoded constructor args from prepare_bytecode.ts
 * Or encode manually: "ezUSD", "ezUSD", 6, 1000000000000000, "https://ezusd.gongxifacai.win/ezusd.png"
 */
contract ezUSD {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    string public logoURI;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        string memory _logoURI
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        logoURI = _logoURI;
        balanceOf[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}

