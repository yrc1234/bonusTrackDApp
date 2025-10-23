# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-level Code Architecture and Structure
This repository contains a Hardhat project for developing, testing, and deploying Solidity smart contracts. It leverages the following key components:
*   **Hardhat**: The development environment for compiling, testing, and deploying smart contracts.
*   **OpenZeppelin Contracts**: Utilized for secure and upgradeable smart contract implementations.
*   **TypeScript**: Used for Hardhat configuration, scripts, and tests.
*   **Viem**: Integrated for interacting with Ethereum, as indicated by `@nomicfoundation/hardhat-toolbox-viem`.
*   **Environment Variables**: Sensitive information like `ALCHEMY_SEPOLIA_URL`, `SEPOLIA_PRIVATE_KEY`, and `ETHERSCAN_KEY` are managed via a `.env` file (loaded by `dotenv`), which are used for network configurations and contract verification on Sepolia testnet.
*   **contracts/**: Directory for Solidity smart contracts.
*   **ignition/**: Directory likely containing deployment scripts for Hardhat Ignition.
*   **test/**: Directory for contract tests (written in TypeScript).

## Common Development Tasks

### Install Dependencies
```bash
npm install
```

### Compile Contracts
```bash
npx hardhat compile
```

### Run All Tests
```bash
npx hardhat test
```

### Run a Single Test File
```bash
npx hardhat test <path-to-test-file>
```
(e.g., `npx hardhat test test/Lock.ts`)

### Lint / Type Check
```bash
npx tsc --noEmit
```

### Deploy Contracts
Deployment scripts are typically found in the `ignition/` directory. An example deployment command for the Sepolia network might look like this:
```bash
npx hardhat ignition deploy <IGNITION_MODULE_NAME> --network sepolia
```
(Replace `<IGNITION_MODULE_NAME>` with the actual Ignition module name, e.g., `LockModule` if there is `ignition/modules/Lock.ts`)

### Verify Contracts on Etherscan
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```
(Ensure `ETHERSCAN_KEY` is set in your `.env` file)

## Important Development Notes
*   **Custom Error Handling:** The `contracts/recordsV1.sol` file has begun implementing custom error handling using `error InvalidInput(string field, string reason);` for data validation and more specific custom errors (e.g., `InvalidClientNonce`) for critical logic. The process of fully migrating all `require` statements to these custom errors is in progress.
