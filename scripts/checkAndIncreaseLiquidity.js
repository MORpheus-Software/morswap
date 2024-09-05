const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking and increasing liquidity with the account:", deployer.address);

  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
  const poolAddress = "0xCb07e11282F970F6c52DbFa25101a4d0C99e9d34";
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethTokenAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";

  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  // Check existing position
  const positionId = 737; // The NFT ID from the previous liquidity addition
  const position = await positionManager.positions(positionId);
  console.log("Existing position:");
  console.log("  Token0:", position.token0);
  console.log("  Token1:", position.token1);
  console.log("  Fee:", position.fee.toString());
  console.log("  TickLower:", position.tickLower.toString());
  console.log("  TickUpper:", position.tickUpper.toString());
  console.log("  Liquidity:", position.liquidity.toString());

  // Check pool state
  const slot0 = await pool.slot0();
  console.log("\nPool state:");
  console.log("  SqrtPriceX96:", slot0.sqrtPriceX96.toString());
  console.log("  Tick:", slot0.tick.toString());
  console.log("  Liquidity:", (await pool.liquidity()).toString());

  // Increase liquidity
  console.log("\nIncreasing liquidity...");
  const morToken = await ethers.getContractAt("IERC20", morTokenAddress);
  const wethToken = await ethers.getContractAt("IERC20", wethTokenAddress);

  await morToken.approve(nonfungiblePositionManagerAddress, ethers.utils.parseUnits("1", 18));
  await wethToken.approve(nonfungiblePositionManagerAddress, ethers.utils.parseUnits("0.001", 18));

  const increaseLiquidityParams = {
    tokenId: positionId,
    amount0Desired: ethers.utils.parseUnits("0.001", 18),
    amount1Desired: ethers.utils.parseUnits("1", 18),
    amount0Min: 0,
    amount1Min: 0,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20
  };

  try {
    const tx = await positionManager.increaseLiquidity(increaseLiquidityParams, { gasLimit: 500000 });
    const receipt = await tx.wait();
    console.log("Liquidity increased successfully. Transaction hash:", receipt.transactionHash);

    // Check updated position
    const updatedPosition = await positionManager.positions(positionId);
    console.log("\nUpdated position:");
    console.log("  Liquidity:", updatedPosition.liquidity.toString());

    // Check updated pool state
    const updatedSlot0 = await pool.slot0();
    console.log("\nUpdated pool state:");
    console.log("  SqrtPriceX96:", updatedSlot0.sqrtPriceX96.toString());
    console.log("  Tick:", updatedSlot0.tick.toString());
    console.log("  Liquidity:", (await pool.liquidity()).toString());

  } catch (error) {
    console.error("Failed to increase liquidity:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });