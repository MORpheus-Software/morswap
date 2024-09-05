const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Nonfungible Position Manager with the account:", deployer.address);

  // Deploy NonfungiblePositionManager
  const NonfungiblePositionManager = await hre.ethers.getContractFactory("NonfungiblePositionManager");
  const nonfungiblePositionManager = await NonfungiblePositionManager.deploy();

  await nonfungiblePositionManager.deployed();
  console.log("Nonfungible Position Manager deployed to:", nonfungiblePositionManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
