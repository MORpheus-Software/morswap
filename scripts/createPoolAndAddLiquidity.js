const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const poolFee = 10000; // 1%

  let poolAddress = await factory.getPool(wethAddress, morAddress, poolFee);
  console.log("Existing pool address:", poolAddress);

  if (poolAddress === ethers.constants.AddressZero) {
    console.log("Pool doesn't exist. Creating new pool...");
    const tx = await factory.createPool(wethAddress, morAddress, poolFee);
    await tx.wait();
    poolAddress = await factory.getPool(wethAddress, morAddress, poolFee);
    console.log("New pool created at address:", poolAddress);
  }

  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  console.log("Initializing pool...");
  const initialPrice = ethers.utils.parseUnits("0.001", 18); // 1 WETH = 1000 MOR
  const sqrtPriceX96 = ethers.BigNumber.from(
    ethers.utils.parseUnits(Math.sqrt(0.001).toFixed(18), 18)
  ).mul(ethers.BigNumber.from(2).pow(96)).div(ethers.utils.parseUnits("1", 18));

  console.log("Calculated sqrtPriceX96:", sqrtPriceX96.toString());

  try {
    await pool.initialize(sqrtPriceX96);
    console.log("Pool initialized");
  } catch (error) {
    if (error.message.includes("LOK")) {
      console.log("Pool is already initialized. Proceeding with liquidity addition.");
    } else {
      throw error;
    }
  }

  console.log("Current tick:", (await pool.slot0()).tick.toString());

  const currentTick = (await pool.slot0()).tick;
  const tickSpacing = await pool.tickSpacing();
  const tickLower = Math.floor(currentTick / tickSpacing) * tickSpacing - tickSpacing * 10;
  const tickUpper = Math.ceil(currentTick / tickSpacing) * tickSpacing + tickSpacing * 10;

  const amount0ToAdd = ethers.utils.parseUnits("0.01", 18); // 0.01 WETH
  const amount1ToAdd = ethers.utils.parseUnits("10", 18); // 10 MOR (1:1000 ratio)

  console.log("Approving tokens for transfer...");
  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);
  await weth.approve(nonfungiblePositionManagerAddress, ethers.constants.MaxUint256);
  await mor.approve(nonfungiblePositionManagerAddress, ethers.constants.MaxUint256);

  const mintParams = {
    token0: wethAddress,
    token1: morAddress,
    fee: poolFee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: amount0ToAdd,
    amount1Desired: amount1ToAdd,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20
  };

  console.log("Adding liquidity...");
  try {
    const tx = await positionManager.mint(mintParams, { gasLimit: 5000000 });
    const receipt = await tx.wait();
    console.log("Liquidity added successfully. Transaction hash:", receipt.transactionHash);
    
    for (const event of receipt.events) {
      if (event.event === "IncreaseLiquidity") {
        console.log("Liquidity added:", event.args.liquidity.toString());
        console.log("Amount of WETH added:", ethers.utils.formatUnits(event.args.amount0, 18));
        console.log("Amount of MOR added:", ethers.utils.formatUnits(event.args.amount1, 18));
        break;
      }
    }
  } catch (error) {
    console.error("Failed to add liquidity:", error.message);
  }

  const finalLiquidity = await pool.liquidity();
  console.log("Final pool liquidity:", finalLiquidity.toString());

  const { sqrtPriceX96: finalSqrtPriceX96 } = await pool.slot0();
  const finalPrice = (finalSqrtPriceX96 * finalSqrtPriceX96 * (10**18) / (2**192)) / (10**18);
  console.log("Final pool price (MOR per WETH):", finalPrice);
  console.log("Final pool price (WETH per MOR):", 1 / finalPrice);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });