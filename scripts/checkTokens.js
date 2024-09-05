const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking tokens for account:", deployer.address);

  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);

  const wethBalance = await weth.balanceOf(deployer.address);
  const morBalance = await mor.balanceOf(deployer.address);
  const wethAllowance = await weth.allowance(deployer.address, nonfungiblePositionManagerAddress);
  const morAllowance = await mor.allowance(deployer.address, nonfungiblePositionManagerAddress);

  console.log("WETH balance:", ethers.utils.formatUnits(wethBalance, 18));
  console.log("MOR balance:", ethers.utils.formatUnits(morBalance, 18));
  console.log("WETH allowance:", ethers.utils.formatUnits(wethAllowance, 18));
  console.log("MOR allowance:", ethers.utils.formatUnits(morAllowance, 18));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });