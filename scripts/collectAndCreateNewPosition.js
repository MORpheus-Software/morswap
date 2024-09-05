const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Collecting fees and creating new position with the account:", deployer.address);

  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
  const poolAddress = "0xCb07e11282F970F6c52DbFa25101a4d0C99e9d34";
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethTokenAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";

  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  // Collect fees
  const positionId = 737;
  console.log("Collecting fees for position:", positionId);
  try {
    const tx = await positionManager.collect({
      tokenId: positionId,
      recipient: deployer.address,
      amount0Max: ethers.constants.MaxUint256,
      amount1Max: ethers.constants.MaxUint256
    }, { gasLimit: 300000 });
    const receipt = await tx.wait();
    console.log("Fees collected. Transaction hash:", receipt.transactionHash);
  } catch (error) {
    console.error("Failed to collect fees:", error.message);
  }

  // Create new position
  console.log("\nCreating new position...");
  const morToken = await ethers.getContractAt("IERC20", morTokenAddress);
  const wethToken = await ethers.getContractAt("IERC20", wethTokenAddress);

  await morToken.approve(nonfungiblePositionManagerAddress, ethers.utils.parseUnits("10", 18));
  await wethToken.approve(nonfungiblePositionManagerAddress, ethers.utils.parseUnits("0.01", 18));

  const slot0 = await pool.slot0();
  const currentTick = slot0.tick;
  const tickSpacing = 60;
  const mintParams = {
    token0: wethTokenAddress,
    token1: morTokenAddress,
    fee: 3000,
    tickLower: Math.floor(currentTick / tickSpacing) * tickSpacing - tickSpacing * 10,
    tickUpper: Math.ceil(currentTick / tickSpacing) * tickSpacing + tickSpacing * 10,
    amount0Desired: ethers.utils.parseUnits("0.01", 18),
    amount1Desired: ethers.utils.parseUnits("10", 18),
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20
  };

  try {
    const tx = await positionManager.mint(mintParams, { gasLimit: 500000 });
    const receipt = await tx.wait();
    console.log("New position created. Transaction hash:", receipt.transactionHash);

    // Check updated pool state
    const updatedSlot0 = await pool.slot0();
    console.log("\nUpdated pool state:");
    console.log("  SqrtPriceX96:", updatedSlot0.sqrtPriceX96.toString());
    console.log("  Tick:", updatedSlot0.tick.toString());
    console.log("  Liquidity:", (await pool.liquidity()).toString());
  } catch (error) {
    console.error("Failed to create new position:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });