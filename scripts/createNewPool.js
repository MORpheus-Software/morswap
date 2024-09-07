const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const poolFee = 10000; // 1%

  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);

  // Check if the pool exists
  let poolAddress = await factory.getPool(wethAddress, morAddress, poolFee);
  
  if (poolAddress !== ethers.constants.AddressZero) {
    console.log("Pool already exists at address:", poolAddress);
    console.log("Exiting without creating a new pool.");
    return;
  }

  console.log("Creating new pool...");
  const tx = await factory.createPool(wethAddress, morAddress, poolFee);
  await tx.wait();
  poolAddress = await factory.getPool(wethAddress, morAddress, poolFee);
  console.log("New pool created at address:", poolAddress);

  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  // Initialize the pool with the new price: 1 WETH = 100 MOR
  console.log("Initializing pool...");
  const initialPrice = ethers.utils.parseUnits("0.01", 18); // 1 WETH = 100 MOR
  const sqrtPriceX96 = ethers.BigNumber.from(
    ethers.utils.parseUnits(Math.sqrt(0.01).toFixed(18), 18)
  ).mul(ethers.BigNumber.from(2).pow(96)).div(ethers.utils.parseUnits("1", 18));

  console.log("Calculated sqrtPriceX96:", sqrtPriceX96.toString());

  try {
    await pool.initialize(sqrtPriceX96);
    console.log("Pool initialized successfully");
  } catch (error) {
    console.error("Failed to initialize pool:", error.message);
    return;
  }

  // Print initial pool state
  const { tick } = await pool.slot0();
  console.log("Initial tick:", tick.toString());

  const initialSqrtPriceX96 = (await pool.slot0()).sqrtPriceX96;
  const initialPriceWETHperMOR = (initialSqrtPriceX96 * initialSqrtPriceX96 * (10**18) / (2**192)) / (10**18);
  const initialPriceMORperWETH = 1 / initialPriceWETHperMOR;
  console.log("Initial pool price (WETH per MOR):", initialPriceWETHperMOR);
  console.log("Initial pool price (MOR per WETH):", initialPriceMORperWETH);

  console.log("New pool created and initialized. Ready for liquidity addition.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });