// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Convert
 * @dev Contract for converting between USDT and ezUSD
 * - Deposit: 1 USDT -> 1 ezUSD
 * - Redeem: 1 ezUSD -> 0.999 USDT
 * - Only controller can withdraw USDT
 */
contract Convert {
    // Token addresses
    address public immutable usdt;
    address public immutable ezusd;
    
    // Controller address (can withdraw USDT)
    address public controller;
    
    // Events
    event Deposit(address indexed user, uint256 usdtAmount, uint256 ezusdAmount);
    event Redeem(address indexed user, uint256 ezusdAmount, uint256 usdtAmount);
    event Withdraw(address indexed controller, uint256 amount);
    event ControllerChanged(address indexed oldController, address indexed newController);
    
    constructor(address _usdt, address _ezusd, address _controller) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_ezusd != address(0), "Invalid ezUSD address");
        require(_controller != address(0), "Invalid controller address");
        
        usdt = _usdt;
        ezusd = _ezusd;
        controller = _controller;
    }
    
    /**
     * @dev Deposit USDT to receive ezUSD at 1:1 ratio
     * @param amount Amount of USDT to deposit (with 6 decimals)
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer USDT from user to this contract
        // USDT uses transfer/transferFrom pattern
        (bool success, ) = usdt.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        require(success, "USDT transfer failed");
        
        // Transfer ezUSD to user (1:1 ratio)
        (bool ezusdSuccess, ) = ezusd.call(
            abi.encodeWithSignature("transfer(address,uint256)", msg.sender, amount)
        );
        require(ezusdSuccess, "ezUSD transfer failed");
        
        emit Deposit(msg.sender, amount, amount);
    }
    
    /**
     * @dev Redeem ezUSD to receive USDT at 1:0.999 ratio
     * @param amount Amount of ezUSD to redeem (with 6 decimals)
     */
    function redeem(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate USDT amount: amount * 999 / 1000 (0.999 ratio)
        uint256 usdtAmount = (amount * 999) / 1000;
        require(usdtAmount > 0, "USDT amount too small");
        
        // Transfer ezUSD from user to this contract
        (bool ezusdSuccess, ) = ezusd.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        require(ezusdSuccess, "ezUSD transfer failed");
        
        // Transfer USDT to user
        (bool usdtSuccess, ) = usdt.call(
            abi.encodeWithSignature("transfer(address,uint256)", msg.sender, usdtAmount)
        );
        require(usdtSuccess, "USDT transfer failed");
        
        emit Redeem(msg.sender, amount, usdtAmount);
    }
    
    /**
     * @dev Withdraw USDT from contract (only controller)
     * @param amount Amount of USDT to withdraw
     */
    function withdraw(uint256 amount) external {
        require(msg.sender == controller, "Only controller can withdraw");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer USDT to controller
        (bool success, ) = usdt.call(
            abi.encodeWithSignature("transfer(address,uint256)", controller, amount)
        );
        require(success, "USDT transfer failed");
        
        emit Withdraw(controller, amount);
    }
    
    /**
     * @dev Change controller address (only current controller)
     * @param newController New controller address
     */
    function setController(address newController) external {
        require(msg.sender == controller, "Only controller can change controller");
        require(newController != address(0), "Invalid controller address");
        
        address oldController = controller;
        controller = newController;
        
        emit ControllerChanged(oldController, newController);
    }
    
    /**
     * @dev Get USDT balance of this contract
     */
    function getUSDTBalance() external view returns (uint256) {
        (bool success, bytes memory data) = usdt.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        require(success, "Failed to get USDT balance");
        return abi.decode(data, (uint256));
    }
    
    /**
     * @dev Get ezUSD balance of this contract
     */
    function getEzUSDBalance() external view returns (uint256) {
        (bool success, bytes memory data) = ezusd.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        require(success, "Failed to get ezUSD balance");
        return abi.decode(data, (uint256));
    }
}

