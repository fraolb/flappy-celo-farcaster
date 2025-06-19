// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {FlappyRocketGame} from "../src/FlappyRocket.sol";
import {ERC20} from "@openzeppelin/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockToken", "MOCK") {
        _mint(msg.sender, 1000 ether);
    }
}

contract FlappyRocketGameTest is Test {
    FlappyRocketGame public game;
    MockERC20 public mockToken;

    address public owner = address(0x1);
    address public player1 = address(0x2);
    address public player2 = address(0x3);
    address public winner = address(0x4);

    uint256 public constant MIN_DEPOSIT = 0.1 ether;

    function setUp() public {
        vm.deal(owner, 10 ether);
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(winner, 10 ether);

        vm.prank(owner);
        game = new FlappyRocketGame(MIN_DEPOSIT);

        mockToken = new MockERC20();
    }

    // ========== Constructor Tests ==========
    function test_Constructor_SetsOwner() public {
        assertEq(game.owner(), owner);
    }

    function test_Constructor_SetsMinDeposit() public {
        assertEq(game.getMinDepositAmount(), MIN_DEPOSIT);
    }

    function test_Constructor_RevertsIfZeroMinDeposit() public {
        vm.expectRevert("Minimum deposit must be greater than 0");
        new FlappyRocketGame(0);
    }

    // ========== Deposit Tests ==========
    function test_DepositCELO_UpdatesBalances() public {
        uint256 depositAmount = 0.5 ether;

        vm.prank(player1);
        game.depositCELO{value: depositAmount}();

        assertEq(game.getPlayerCELOBalance(player1), depositAmount);
        assertEq(game.getCELOBalance(), depositAmount);
        assertEq(address(game).balance, depositAmount);
    }

    function test_DepositCELO_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit FlappyRocketGame.CELODeposit(player1, 0.5 ether);

        vm.prank(player1);
        game.depositCELO{value: 0.5 ether}();
    }

    function test_DepositCELO_RevertsIfBelowMin() public {
        vm.expectRevert(
            "Deposit amount must be greater than or equal to minimum"
        );
        vm.prank(player1);
        game.depositCELO{value: 0.05 ether}(); // Below 0.1 ether minimum
    }

    function test_MultipleDeposits_AccumulateBalance() public {
        vm.prank(player1);
        game.depositCELO{value: 0.5 ether}();

        vm.prank(player1);
        game.depositCELO{value: 0.3 ether}();

        assertEq(game.getPlayerCELOBalance(player1), 0.8 ether);
        assertEq(game.getCELOBalance(), 0.8 ether);
    }

    // ========== Payout Tests ==========
    function test_PayoutCELOToWinner_Works() public {
        uint256 depositAmount = 1 ether;
        uint256 payoutAmount = 0.5 ether;

        // Player deposits
        vm.prank(player1);
        game.depositCELO{value: depositAmount}();

        // Owner pays winner
        uint256 initialWinnerBalance = winner.balance;
        vm.prank(owner);
        game.payoutCELOToWinner(payable(winner), payoutAmount);

        assertEq(winner.balance, initialWinnerBalance + payoutAmount);
        assertEq(game.getCELOBalance(), depositAmount - payoutAmount);
    }

    function test_PayoutCELOToWinner_EmitsEvent() public {
        vm.prank(player1);
        game.depositCELO{value: 1 ether}();

        vm.expectEmit(true, true, false, true);
        emit FlappyRocketGame.CELOPayout(winner, 0.5 ether);

        vm.prank(owner);
        game.payoutCELOToWinner(payable(winner), 0.5 ether);
    }

    function test_PayoutCELOToWinner_RevertsIfNotOwner() public {
        vm.prank(player1);
        game.depositCELO{value: 1 ether}();

        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(player1); // Not owner
        game.payoutCELOToWinner(payable(winner), 0.5 ether);
    }

    function test_PayoutCELOToWinner_RevertsIfInsufficientBalance() public {
        vm.prank(player1);
        game.depositCELO{value: 0.3 ether}();

        vm.expectRevert("Insufficient CELO balance");
        vm.prank(owner);
        game.payoutCELOToWinner(payable(winner), 0.5 ether); // Trying to pay more than balance
    }

    // ========== Withdrawal Tests ==========
    function test_WithdrawCELO_Works() public {
        uint256 depositAmount = 1 ether;
        uint256 withdrawAmount = 0.5 ether;

        vm.prank(player1);
        game.depositCELO{value: depositAmount}();

        uint256 initialOwnerBalance = owner.balance;
        vm.prank(owner);
        game.withdrawCELO(withdrawAmount);

        assertEq(owner.balance, initialOwnerBalance + withdrawAmount);
        assertEq(game.getCELOBalance(), depositAmount - withdrawAmount);
    }

    function test_WithdrawCELO_EmitsEvent() public {
        vm.prank(player1);
        game.depositCELO{value: 1 ether}();

        vm.expectEmit(true, true, false, true);
        emit FlappyRocketGame.CELOWithdrawal(owner, 0.5 ether);

        vm.prank(owner);
        game.withdrawCELO(0.5 ether);
    }

    function test_WithdrawCELO_RevertsIfNotOwner() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(player1); // Not owner
        game.withdrawCELO(0.1 ether);
    }

    // ========== ERC20 Recovery Tests ==========
    function test_RecoverERC20_Works() public {
        // Send some mock tokens to contract
        uint256 tokenAmount = 100;
        mockToken.transfer(address(game), tokenAmount);

        uint256 initialOwnerBalance = mockToken.balanceOf(owner);
        vm.prank(owner);
        game.recoverERC20(address(mockToken));

        assertEq(mockToken.balanceOf(owner), initialOwnerBalance + tokenAmount);
    }

    function test_RecoverERC20_EmitsEvent() public {
        mockToken.transfer(address(game), 100);

        vm.expectEmit(true, false, false, true);
        emit FlappyRocketGame.TokenRecovery(address(mockToken), 100);

        vm.prank(owner);
        game.recoverERC20(address(mockToken));
    }

    function test_RecoverERC20_RevertsIfNotOwner() public {
        mockToken.transfer(address(game), 100);

        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(player1); // Not owner
        game.recoverERC20(address(mockToken));
    }

    // ========== Minimum Deposit Tests ==========
    function test_SetMinDepositAmount_Works() public {
        uint256 newMinDeposit = 0.2 ether;
        vm.prank(owner);
        game.setMinDepositAmount(newMinDeposit);

        assertEq(game.getMinDepositAmount(), newMinDeposit);
    }

    function test_SetMinDepositAmount_EmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit FlappyRocketGame.MinDepositChanged(0.2 ether);

        vm.prank(owner);
        game.setMinDepositAmount(0.2 ether);
    }

    function test_SetMinDepositAmount_RevertsIfZero() public {
        vm.expectRevert("Minimum deposit must be greater than 0");
        vm.prank(owner);
        game.setMinDepositAmount(0);
    }

    function test_SetMinDepositAmount_RevertsIfNotOwner() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(player1); // Not owner
        game.setMinDepositAmount(0.2 ether);
    }

    // ========== Fallback/Receive Tests ==========
    function test_ReceiveCELO_Works() public {
        uint256 sendAmount = 1 ether;
        (bool success, ) = address(game).call{value: sendAmount}("");
        require(success, "Transfer failed");

        assertEq(address(game).balance, sendAmount);
        // Note: This goes to contract balance but not player balance
        assertEq(game.getCELOBalance(), 0); // Not counted in game balance
    }
}
