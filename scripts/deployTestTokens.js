const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const TestToken = await ethers.getContractFactory("TestToken");
  
  const tt5 = await TestToken.deploy("Test Token 5", "TT5", ethers.utils.parseEther("1000000"));
  await tt5.deployed();
  console.log("TT5 deployed to:", tt5.address);

  const tt6 = await TestToken.deploy("Test Token 6", "TT6", ethers.utils.parseEther("1000000"));
  await tt6.deployed();
  console.log("TT6 deployed to:", tt6.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });