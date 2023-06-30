require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 2100000,
      gasPrice: 8000000000,
      blockGasLimit: 100000000429720,
      /* forking: {
        url: MAINNET_RPC_URL,
      }, */
    },
    localhost: {
      chainId: 31337,
      gas: 2100000,
      gasPrice: 8000000000,
      blockGasLimit: 100000000429720,
    },
    sepolia: {
      chainId: 11155111,
      blockConfirmations: 6,
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    mumbai: {
      chainId: 80001,
      blockConfirmations: 6,
      url: MUMBAI_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      mumbai: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-reporter.txt",
    noColors: true,
    currency: "USD",
    //gasPriceApi:
    //  "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
  },
  //solidity: "0.8.17",
  solidity: {
    compilers: [
      {
        version: "0.8.18",
        version: "0.8.9",
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
    company: {
      default: 2,
    },
    government: {
      default: 3,
    },
  },
  mocha: {
    timeout: 500000, //500 seconds
  },
};
