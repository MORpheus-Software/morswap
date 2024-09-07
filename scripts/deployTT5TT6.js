const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const SwapTT5TT6 = await hre.ethers.getContractFactory("SwapTT5TT6");
  const swapTT5TT6 = await SwapTT5TT6.deploy();

  await swapTT5TT6.deployed();

  console.log("SwapTT5TT6 deployed to:", swapTT5TT6.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });