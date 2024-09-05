// scripts/deployFactory.js
const { ethers } = require("hardhat");
const UniswapV3FactoryArtifact = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying Uniswap V3 Factory with the account:', deployer.address);

  // Get the ContractFactory for UniswapV3Factory
  const UniswapV3Factory = new ethers.ContractFactory(
    UniswapV3FactoryArtifact.abi,
    UniswapV3FactoryArtifact.bytecode,
    deployer
  );

  // Deploy the factory contract
  const factory = await UniswapV3Factory.deploy();
  await factory.deployed();

  console.log('Uniswap V3 Factory deployed to:', factory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

