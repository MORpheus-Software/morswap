const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with the account:", deployer.address);

  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const poolFee = 3000; // 0.3%

  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);

  const poolAddress = "0xe49D59f17Eb401fB66681F6095d7DB3bE0CdAb8b";
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  const slot0 = await pool.slot0();
  const currentTick = slot0.tick;

  console.log("Current tick:", currentTick.toString());

  // Calculate amounts to add
  const wethToAdd = ethers.utils.parseUnits("0.015", 18); // 0.015 WETH
  const targetPrice = 1000; // 1 WETH = 1000 MOR
  const morToAdd = wethToAdd.mul(targetPrice);

  console.log("WETH to add:", ethers.utils.formatUnits(wethToAdd, 18));
  console.log("MOR to add:", ethers.utils.formatUnits(morToAdd, 18));

  // Adjust the tick range to be narrower
  const targetTick = Math.log(Math.sqrt(targetPrice)) / Math.log(Math.sqrt(1.0001));
  const tickSpacing = 60;
  const tickRange = 5 * tickSpacing; // Very narrow range
  const tickLower = Math.floor((targetTick - tickRange) / tickSpacing) * tickSpacing;
  const tickUpper = Math.ceil((targetTick + tickRange) / tickSpacing) * tickSpacing;
  console.log("Using tick range:", tickLower, "-", tickUpper);

  console.log("Approving tokens for transfer...");
  await weth.approve(nonfungiblePositionManagerAddress, ethers.constants.MaxUint256);
  await mor.approve(nonfungiblePositionManagerAddress, ethers.constants.MaxUint256);
  console.log("Tokens approved with maximum allowance.");

  const mintParams = {
    token0: wethAddress,
    token1: morAddress,
    fee: poolFee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: wethToAdd,
    amount1Desired: morToAdd,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20
  };

  console.log("Adding liquidity...");
  const tx = await positionManager.mint(mintParams, { gasLimit: 10000000 });
  console.log("Transaction sent. Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("Liquidity added successfully. Transaction hash:", receipt.transactionHash);

  for (const event of receipt.events) {
    if (event.event === "IncreaseLiquidity") {
      console.log("Liquidity added:", event.args.liquidity.toString());
      console.log("Amount of WETH used:", ethers.utils.formatUnits(event.args.amount0, 18));
      console.log("Amount of MOR used:", ethers.utils.formatUnits(event.args.amount1, 18));
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });