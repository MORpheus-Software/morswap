const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Specify the amount of WETH to unwrap
  const amountToUnwrap = "0.01"; // Change this value as needed
  const amountToUnwrapWei = ethers.utils.parseEther(amountToUnwrap);

  console.log(`Unwrapping ${amountToUnwrap} WETH back to ETH...`);

  const wethAddress = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E"; // WETH contract address
  const weth = await ethers.getContractAt("WETHMock", wethAddress);

  // Check initial WETH balance
  const initialWethBalance = await weth.balanceOf(deployer.address);
  console.log(`Initial WETH balance: ${ethers.utils.formatEther(initialWethBalance)}`);

  // Check if we have enough WETH to unwrap
  if (initialWethBalance.lt(amountToUnwrapWei)) {
    console.error(`Insufficient WETH balance. You only have ${ethers.utils.formatEther(initialWethBalance)} WETH.`);
    return;
  }

  // Unwrap specified amount of WETH
  const tx = await weth.withdraw(amountToUnwrapWei);
  await tx.wait();

  console.log(`${amountToUnwrap} WETH unwrapped to ETH successfully!`);

  // Check final WETH balance
  const finalWethBalance = await weth.balanceOf(deployer.address);
  console.log(`Final WETH balance: ${ethers.utils.formatEther(finalWethBalance)}`);

  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`ETH balance: ${ethers.utils.formatEther(ethBalance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});