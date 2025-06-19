// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/token/ERC20/IERC20.sol";
import "@openzeppelin/access/Ownable.sol";

contract FlappyRocketGame is Ownable {
    // Player deposits and balances
    mapping(address => uint256) public playerCELODeposits;
    uint256 public totalCELOBalance;

    // Minimum deposit amount (in CELO)
    uint256 public minDepositAmount;

    // Events
    event CELODeposit(address indexed player, uint256 amount);
    event CELOPayout(address indexed winner, uint256 amount);
    event CELOWithdrawal(address indexed owner, uint256 amount);
    event TokenRecovery(address indexed token, uint256 amount);
    event MinDepositChanged(uint256 newAmount);

    /**
     * @dev Constructor sets deployer as owner and initial minimum deposit
     * @param _minDepositAmount The initial minimum deposit amount in CELO
     */
    constructor(uint256 _minDepositAmount) Ownable(msg.sender) {
        require(
            _minDepositAmount > 0,
            "Minimum deposit must be greater than 0"
        );
        minDepositAmount = _minDepositAmount;
        // Owner is automatically set to msg.sender by Ownable
    }

    /**
     * @dev Allows owner to set the minimum deposit amount
     * @param _newMinAmount The new minimum deposit amount in CELO
     */
    function setMinDepositAmount(uint256 _newMinAmount) external onlyOwner {
        require(_newMinAmount > 0, "Minimum deposit must be greater than 0");
        minDepositAmount = _newMinAmount;
        emit MinDepositChanged(_newMinAmount);
    }

    /**
     * @dev Allows players to deposit native CELO to play the game
     */
    function depositCELO() external payable {
        require(
            msg.value >= minDepositAmount,
            "Deposit amount must be greater than or equal to minimum"
        );

        playerCELODeposits[msg.sender] += msg.value;
        totalCELOBalance += msg.value;

        emit CELODeposit(msg.sender, msg.value);
    }

    /**
     * @dev Allows owner to payout native CELO to winner
     * @param winner The address of the winning player
     * @param amount The amount of CELO to payout
     */
    function payoutCELOToWinner(
        address payable winner,
        uint256 amount
    ) external onlyOwner {
        require(winner != address(0), "Invalid winner address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= totalCELOBalance, "Insufficient CELO balance");

        totalCELOBalance -= amount;
        (bool sent, ) = winner.call{value: amount}("");
        require(sent, "Failed to send CELO");

        emit CELOPayout(winner, amount);
    }

    /**
     * @dev Allows owner to withdraw native CELO from contract
     * @param amount The amount of CELO to withdraw
     */
    function withdrawCELO(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= totalCELOBalance, "Insufficient CELO balance");

        totalCELOBalance -= amount;
        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "Failed to send CELO");

        emit CELOWithdrawal(owner(), amount);
    }

    /**
     * @dev Emergency function to recover accidentally sent ERC20 tokens
     * @param tokenAddress The address of the ERC20 token to recover
     */
    function recoverERC20(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to recover");

        token.transfer(owner(), balance);
        emit TokenRecovery(tokenAddress, balance);
    }

    // View functions
    function getCELOBalance() external view returns (uint256) {
        return totalCELOBalance;
    }

    function getPlayerCELOBalance(
        address player
    ) external view returns (uint256) {
        return playerCELODeposits[player];
    }

    function getMinDepositAmount() external view returns (uint256) {
        return minDepositAmount;
    }

    // Receive CELO and native tokens
    receive() external payable {}

    // Fallback for accidental sends with data
    fallback() external payable {}
}
