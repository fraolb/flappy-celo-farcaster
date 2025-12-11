// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/token/ERC20/IERC20.sol";
import "@openzeppelin/access/Ownable.sol";

contract FlappyRocketGame is Ownable {
    // Tracks total CELO balance including direct deposits
    uint256 public totalCELOBalance;

    // Events
    event CELODeposit(address indexed player, uint256 amount);
    event CELOPayout(address indexed winner, uint256 amount);
    event CELOWithdrawal(address indexed owner, uint256 amount);
    event TokenRecovery(address indexed token, uint256 amount);

    constructor() Ownable(msg.sender) {
        // Owner is automatically set to msg.sender by Ownable
    }

    /**
     * @dev Allows owner to distribute CELO rewards to players
     * This is called by the server after web2 game completion
     * @param winner The address of the player to reward
     * @param amount The amount of CELO to payout
     */
    function distributeReward(
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

    /**
     * @dev View function to get contract's actual CELO balance
     * This should match totalCELOBalance if all transfers are tracked correctly
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev View function to get tracked CELO balance
     */
    function getTrackedBalance() external view returns (uint256) {
        return totalCELOBalance;
    }

    /**
     * @dev Allows anyone to deposit CELO to fund rewards
     * Can be called by owner or players who want to fund the contract
     */
    function depositCELO() external payable {
        require(msg.value > 0, "Amount must be greater than 0");

        totalCELOBalance += msg.value;
        emit CELODeposit(msg.sender, msg.value);
    }

    /**
     * @dev Override receive to track direct CELO deposits
     */
    receive() external payable {
        // Track direct CELO deposits
        totalCELOBalance += msg.value;
        emit CELODeposit(msg.sender, msg.value);
    }

    /**
     * @dev Override fallback to track direct CELO deposits with data
     */
    fallback() external payable {
        // Track direct CELO deposits (with data)
        totalCELOBalance += msg.value;
        emit CELODeposit(msg.sender, msg.value);
    }
}
