require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();


const { ethers } = require("ethers");

module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

    paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
    },  
    networks: {
      arbitrumTestnet: {
        url: `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, // Alchemy API key from .env
        accounts: [`0x${process.env.PRIVATE_KEY}`], // Ensure this line correctly uses the private key from .env
      },
    },
    external: {
      contracts: [
        {
          artifacts: "node_modules/@uniswap/v3-periphery/artifacts",
          deploy: "node_modules/@uniswap/v3-periphery/contracts",
        },
      ],
    },
};

