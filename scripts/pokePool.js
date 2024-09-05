const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Poking pool with the account:", deployer.address);

  const poolAddress = "0xCb07e11282F970F6c52DbFa25101a4d0C99e9d34";
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethTokenAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const swapRouterAddress = "0x101F443B4d1b059569D643917553c771E1b9663E";

  const poolAbi = [
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];
  const pool = new ethers.Contract(poolAddress, poolAbi, deployer);

  console.log("Pool state before swap:");
  let state = await pool.slot0();
  console.log("  sqrtPriceX96:", state.sqrtPriceX96.toString());
  console.log("  tick:", state.tick.toString());
  console.log("  liquidity:", (await pool.liquidity()).toString());

  // Perform a minimal swap
  const swapRouterAbi = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut)"
  ];
  const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterAbi, deployer);

  const morToken = await ethers.getContractAt("IERC20", morTokenAddress);
  await morToken.approve(swapRouterAddress, ethers.utils.parseUnits("0.0001", 18));

  const params = {
    tokenIn: morTokenAddress,
    tokenOut: wethTokenAddress,
    fee: 3000,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountIn: ethers.utils.parseUnits("0.0001", 18),
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0
  };

  console.log("Performing minimal swap...");
  try {
    const tx = await swapRouter.exactInputSingle(params, { gasLimit: 500000 });
    await tx.wait();
    console.log("Swap completed");
  } catch (error) {
    console.error("Swap failed:", error.message);
  }

  console.log("Pool state after swap:");
  state = await pool.slot0();
  console.log("  sqrtPriceX96:", state.sqrtPriceX96.toString());
  console.log("  tick:", state.tick.toString());
  console.log("  liquidity:", (await pool.liquidity()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });