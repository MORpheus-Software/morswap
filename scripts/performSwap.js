const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Performing swap with account:", signer.address);

  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const swapRouterAddress = "0x101F443B4d1b059569D643917553c771E1b9663E";
  const poolAddress = "0xe49D59f17Eb401fB66681F6095d7DB3bE0CdAb8b";
  const feeTier = 3000; // 0.3% fee tier

  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);
  const swapRouter = await ethers.getContractAt("ISwapRouter", swapRouterAddress);
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  // Check pool state
  const liquidity = await pool.liquidity();
  console.log("Pool liquidity:", liquidity.toString());

  const slot0 = await pool.slot0();
  console.log("Pool current tick:", slot0.tick);
  console.log("Pool sqrt price X96:", slot0.sqrtPriceX96.toString());

  const wethBalance = await weth.balanceOf(signer.address);
  const morBalance = await mor.balanceOf(signer.address);
  console.log("WETH balance before swap:", ethers.utils.formatEther(wethBalance));
  console.log("MOR balance before swap:", ethers.utils.formatEther(morBalance));

  // Amount to swap (0.0000001 WETH)
  const amountIn = ethers.utils.parseEther("0.0000001");

  if (wethBalance.lt(amountIn)) {
    console.error("Insufficient WETH balance");
    return;
  }

  // Check allowance
  const allowance = await weth.allowance(signer.address, swapRouterAddress);
  console.log("Current allowance:", ethers.utils.formatEther(allowance));

  if (allowance.lt(amountIn)) {
    console.log("Approving WETH...");
    const approveTx = await weth.approve(swapRouterAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
    console.log("WETH approved");
  } else {
    console.log("Sufficient allowance already exists");
  }

  const deadline = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

  // Get quote for the swap
  const quoterAddress = "0x2779a0CC1c3e0E44D2542EC3e79e3864Ae93Ef0B"; // Arbitrum Goerli Quoter address
  const quoter = await ethers.getContractAt("IQuoterV2", quoterAddress);
  const quoteParams = {
    tokenIn: wethAddress,
    tokenOut: morAddress,
    fee: feeTier,
    amountIn: amountIn,
    sqrtPriceLimitX96: 0
  };

  const quote = await quoter.callStatic.quoteExactInputSingle(quoteParams);
  console.log("Quoted amount out:", ethers.utils.formatEther(quote.amountOut));

  // Set slippage tolerance (e.g., 10%)
  const slippageTolerance = 1000; // 10%
  const amountOutMinimum = quote.amountOut.mul(10000 - slippageTolerance).div(10000);

  const params = {
    tokenIn: wethAddress,
    tokenOut: morAddress,
    fee: feeTier,
    recipient: signer.address,
    deadline: deadline,
    amountIn: amountIn,
    amountOutMinimum: amountOutMinimum,
    sqrtPriceLimitX96: 0
  };

  console.log("Swap parameters:", {
    ...params,
    amountIn: ethers.utils.formatEther(params.amountIn),
    amountOutMinimum: ethers.utils.formatEther(params.amountOutMinimum),
  });

  try {
    console.log("Simulating swap...");
    const result = await swapRouter.callStatic.exactInputSingle(params);
    console.log("Simulation successful. Expected output:", ethers.utils.formatEther(result));

    console.log("Executing swap...");
    const tx = await swapRouter.exactInputSingle(params, { 
      gasLimit: 500000,
    });
    console.log("Swap transaction sent. Hash:", tx.hash);
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Swap transaction confirmed. Status:", receipt.status);

    if (receipt.status === 1) {
      const wethBalanceAfter = await weth.balanceOf(signer.address);
      const morBalanceAfter = await mor.balanceOf(signer.address);
      console.log("WETH balance after swap:", ethers.utils.formatEther(wethBalanceAfter));
      console.log("MOR balance after swap:", ethers.utils.formatEther(morBalanceAfter));
    }
  } catch (error) {
    console.error("Swap failed. Error details:");
    console.error(error);
    if (error.error && error.error.data) {
      try {
        const decodedError = swapRouter.interface.parseError(error.error.data);
        console.error("Decoded error:", decodedError);
      } catch (decodeError) {
        console.error("Failed to decode error:", decodeError);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });