const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Adding liquidity with account:", signer.address);

  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const poolAddress = "0x9Afc054C5B54a01879eAe99A21cd133772C38422";
  const poolFee = 10000; // 1%

  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);
  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);

  // Check balances
  const wethBalance = await weth.balanceOf(signer.address);
  const morBalance = await mor.balanceOf(signer.address);
  console.log("WETH balance:", ethers.utils.formatEther(wethBalance));
  console.log("MOR balance:", ethers.utils.formatEther(morBalance));

  // Get current tick
  const poolAbi = ["function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"];
  const pool = new ethers.Contract(poolAddress, poolAbi, ethers.provider);
  const { tick } = await pool.slot0();
  console.log("Current tick:", tick);

  // Calculate tick range
  const currentTick = -69082; // Use the current tick we observed
  const tickSpacing = 200;
  const tickLower = Math.floor(currentTick / tickSpacing) * tickSpacing - tickSpacing * 50; // Wider range
  const tickUpper = Math.ceil(currentTick / tickSpacing) * tickSpacing + tickSpacing * 50; // Wider range
  console.log("Tick range:", tickLower, "-", tickUpper);

  // Approve tokens
  const wethAmount = ethers.utils.parseEther("0.0001"); // Smaller amount
  const morAmount = ethers.utils.parseEther("100"); // Smaller amount
  await weth.approve(nonfungiblePositionManagerAddress, wethAmount);
  await mor.approve(nonfungiblePositionManagerAddress, morAmount);

  // Prepare mint parameters
  const mintParams = {
    token0: wethAddress,
    token1: morAddress,
    fee: poolFee,
    tickLower,
    tickUpper,
    amount0Desired: wethAmount,
    amount1Desired: morAmount,
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20
  };

  console.log("Adding liquidity...");
  console.log("Mint params:", mintParams);

  try {
    const tx = await positionManager.mint(mintParams, { gasLimit: 500000 });
    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Liquidity added. Transaction hash:", receipt.transactionHash);

    // Log events
    for (const event of receipt.events) {
      if (event.event === "IncreaseLiquidity") {
        console.log("Liquidity added:", event.args.liquidity.toString());
      }
      if (event.event === "Transfer") {
        console.log("NFT Token ID:", event.args.tokenId.toString());
      }
    }

    // Retrieve position details using the correct token ID
    const tokenId = receipt.events.find(e => e.event === "Transfer").args.tokenId;
    const position = await positionManager.positions(tokenId);
    console.log("Position details:");
    console.log("Token ID:", tokenId.toString());
    console.log("Liquidity:", position.liquidity.toString());
    console.log("Lower Tick:", position.tickLower.toString());
    console.log("Upper Tick:", position.tickUpper.toString());
    console.log("FeeGrowthInside0LastX128:", position.feeGrowthInside0LastX128.toString());
    console.log("FeeGrowthInside1LastX128:", position.feeGrowthInside1LastX128.toString());
    console.log("TokensOwed0:", position.tokensOwed0.toString());
    console.log("TokensOwed1:", position.tokensOwed1.toString());
  } catch (error) {
    console.error("Error adding liquidity:", error);
    if (error.transaction) {
      console.error("Failed transaction:", error.transaction);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });