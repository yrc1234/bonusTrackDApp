import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";

import dotenv from 'dotenv';
dotenv.config();
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY]
    }
  },
  etherscan: {
      apiKey: {
        sepolia: process.env.ETHERSCAN_KEY,
        optimisticSepolia: process.env.ETHERSCAN_KEY  // OP Sepolia uses same Etherscan API key
      }
  },
  sourcify: {
    enabled: true
  }
};
export default config;