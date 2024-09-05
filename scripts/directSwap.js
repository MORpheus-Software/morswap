const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  const swapRouterAddress = "0x101F443B4d1b059569D643917553c771E1b9663E";
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethTokenAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";

  const amountIn = ethers.utils.parseUnits("0.1", 18);

  // Get contract instances
  const morToken = await ethers.getContractAt("IERC20", morTokenAddress);
  const swapRouter = await ethers.getContractAt("ISwapRouter02", swapRouterAddress);

  // Check MOR balance
  const morBalance = await morToken.balanceOf(deployer.address);
  console.log("MOR balance before swap:", ethers.utils.formatEther(morBalance));

  // Approve SwapRouter to spend MOR
  console.log("Approving SwapRouter to spend MOR...");
  const approveTx = await morToken.approve(swapRouterAddress, amountIn);
  await approveTx.wait();
  console.log("Approved SwapRouter to spend MOR");

  // Perform the swap
  async function attemptSwap(fee) {
    console.log(`Attempting swap with ${fee/10000}% fee...`);
    try {
      const params = {
        tokenIn: morTokenAddress,
        tokenOut: wethTokenAddress,
        fee: fee,
        recipient: deployer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };

      const swapTx = await swapRouter.exactInputSingle(params, { gasLimit: 500000 });
      console.log("Swap transaction submitted. Waiting for confirmation...");
      const receipt = await swapTx.wait();
      console.log("Swap completed. Transaction hash:", receipt.transactionHash);

      // Check WETH balance
      const wethToken = await ethers.getContractAt("IERC20", wethTokenAddress);
      const wethBalance = await wethToken.balanceOf(deployer.address);
      console.log("WETH balance after swap:", ethers.utils.formatEther(wethBalance));
      return true;
    } catch (error) {
      console.error(`Swap failed with ${fee/10000}% fee:`, error.message);
      if (error.error && error.error.message) {
        console.error("Error details:", error.error.message);
      }
      return false;
    }
  }

  const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
  for (const fee of feeTiers) {
    if (await attemptSwap(fee)) {
      break;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });