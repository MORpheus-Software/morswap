const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking balances for account:", deployer.address);

  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";

  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);

  const wethBalance = await weth.balanceOf(deployer.address);
  const morBalance = await mor.balanceOf(deployer.address);

  console.log("WETH balance:", ethers.utils.formatUnits(wethBalance, 18));
  console.log("MOR balance:", ethers.utils.formatUnits(morBalance, 18));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });