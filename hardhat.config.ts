import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig, vars } from "hardhat/config";

const DO_NOT_LEAK = vars.get("DO_NOT_LEAK");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const LISK_SEPOLIA_RPC_URL = vars.get("LISK_SEPOLIA_RPC_URL");
const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
    "lisk-sepolia": {
      url: LISK_SEPOLIA_RPC_URL,
      accounts: [DO_NOT_LEAK],
      gasPrice: 1000000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com/",
        },
      },
    ],
  },
};

export default config;
