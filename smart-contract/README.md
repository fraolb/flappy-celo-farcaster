# Flappy Rocket Smart Contract

This directory contains the smart contract(s) for the **Flappy Rocket** game, a weekly competition mini-game built on the Celo blockchain.

## Overview

The smart contract is responsible for securely managing the game’s core logic and reward distribution, including:

- **Storing player scores:** Each player’s best score is recorded on-chain.
- **Leaderboard management:** The contract keeps track of the top scores for the weekly competition.
- **Reward distribution:** At the end of each week, the contract can be used to distribute CELO rewards to the top players.
- **Fairness and transparency:** All game results and rewards are verifiable on the Celo blockchain.

## Key Features

- **Immutable records:** Player scores and winners are stored on-chain for transparency.
- **Automated rewards:** The contract can be extended to automatically distribute weekly prizes.
- **Security:** Only valid game interactions are accepted, helping prevent cheating or manipulation.

## Deployment

- **Network:** [Celo](https://celo.org/)
- **Contract Address:** [`0x883D06cc70BE8c3E018EA35f7BB7671B044b4Beb`](https://celoscan.io/address/0x883D06cc70BE8c3E018EA35f7BB7671B044b4Beb)

## Usage

- Deploy the contract to the Celo network (already deployed at the address above).
- Integrate the contract address with the Flappy Rocket web app.
- Interact with the contract via the app or directly using Celo-compatible wallets and tools.

## Files

- `FlappyRocket.s.sol` : Script for deploying the smart contract.
- `FlappyRocket.sol` : Main contract source code.
- `FlappyRocket.test.sol` : Test for the smart contract.
- `README.md`: This documentation.
- (Other files): Deployment scripts, tests, and configuration.

---

**Note:**  
This contract is designed specifically for the Flappy Rocket game and may require adaptation for other use cases.
