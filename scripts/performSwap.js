const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Performing swap with account:", signer.address);

  const routerAddress = "0x101F443B4d1b059569D643917553c771E1b9663E";
  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const poolFees = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

  const routerABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)"
  ];

  const erc20ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ];

  const router = new ethers.Contract(routerAddress, routerABI, signer);
  const weth = new ethers.Contract(wethAddress, erc20ABI, signer);
  const mor = new ethers.Contract(morAddress, erc20ABI, signer);

  const wethDecimals = await weth.decimals();
  const morDecimals = await mor.decimals();
  console.log("WETH decimals:", wethDecimals);
  console.log("MOR decimals:", morDecimals);

  const wethBalance = await weth.balanceOf(signer.address);
  const morBalance = await mor.balanceOf(signer.address);
  console.log("WETH balance before swap:", ethers.utils.formatUnits(wethBalance, wethDecimals));
  console.log("MOR balance before swap:", ethers.utils.formatUnits(morBalance, morDecimals));

  // Check ETH balance
  const ethBalance = await signer.getBalance();
  console.log("ETH balance:", ethers.utils.formatEther(ethBalance));

  // Check allowance
  const allowance = await mor.allowance(signer.address, routerAddress);
  console.log("Current allowance:", ethers.utils.formatUnits(allowance, morDecimals));

  // Approve router to spend MOR if necessary
  if (allowance.lt(ethers.utils.parseUnits("0.01", morDecimals))) {
    console.log("Approving router to spend MOR...");
    const approveTx = await mor.approve(routerAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
    console.log("Approval transaction hash:", approveTx.hash);
  }

  // Swap 0.01 MOR for WETH (reduced amount for testing)
  const amountIn = ethers.utils.parseUnits("0.01", morDecimals);
  const slippageTolerance = 50; // 50% slippage tolerance (very high for testing)
  const amountOutMinimum = 0; // Set to 0 for testing, but in production, calculate this based on expected output and slippage tolerance

  for (const poolFee of poolFees) {
    console.log(`Attempting swap with ${poolFee / 10000}% fee...`);
    
    try {
      const quoteAmountOut = await router.quoteExactInputSingle(morAddress, wethAddress, poolFee, amountIn, 0);
      console.log(`Quoted amount out: ${ethers.utils.formatUnits(quoteAmountOut, wethDecimals)} WETH`);
    } catch (error) {
      console.error(`Quote failed for ${poolFee / 10000}% fee:`, error.message);
      continue;
    }

    const params = {
      tokenIn: morAddress,
      tokenOut: wethAddress,
      fee: poolFee,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum,
      sqrtPriceLimitX96: 0
    };

    console.log("Swap parameters:", params);

    console.log("Performing swap...");
    try {
      const tx = await router.exactInputSingle(params, { gasLimit: 500000 });
      console.log("Swap transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Swap completed. Transaction hash:", receipt.transactionHash);
      console.log("Gas used:", receipt.gasUsed.toString());
      break; // Exit the loop if swap is successful
    } catch (error) {
      console.error(`Swap failed for ${poolFee / 10000}% fee:`, error.message);
      if (error.transaction) {
        console.error("Failed transaction hash:", error.transactionHash);
      }
      if (error.reason) {
        console.error("Error reason:", error.reason);
      }
    }
  }

  const wethBalanceAfter = await weth.balanceOf(signer.address);
  const morBalanceAfter = await mor.balanceOf(signer.address);
  console.log("WETH balance after swap:", ethers.utils.formatUnits(wethBalanceAfter, wethDecimals));
  console.log("MOR balance after swap:", ethers.utils.formatUnits(morBalanceAfter, morDecimals));

  const morSwapped = morBalance.sub(morBalanceAfter);
  const wethReceived = wethBalanceAfter.sub(wethBalance);
  console.log("MOR swapped:", ethers.utils.formatUnits(morSwapped, morDecimals));
  console.log("WETH received:", ethers.utils.formatUnits(wethReceived, wethDecimals));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });