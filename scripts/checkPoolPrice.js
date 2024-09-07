const { ethers } = require("hardhat");

async function main() {
  // Allow pool address to be passed as an argument, or use a default
  const poolAddress = process.argv[2] || "0x9Afc054C5B54a01879eAe99A21cd133772C38422";
  console.log("Checking pool at address:", poolAddress);

  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  const slot0 = await pool.slot0();
  const sqrtPriceX96 = slot0.sqrtPriceX96;
  const liquidity = await pool.liquidity();
  
  // Calculate price as a decimal
  const price = (sqrtPriceX96 * sqrtPriceX96 * (10**18) / (2**192)) / (10**18);

  console.log("Current tick:", slot0.tick.toString());
  console.log("Current sqrtPriceX96:", sqrtPriceX96.toString());
  console.log("Current liquidity:", liquidity.toString());
  console.log("Current price (MOR per WETH):", price.toFixed(18));
  console.log("Current price (WETH per MOR):", (1 / price).toFixed(18));

  const token0 = await pool.token0();
  const token1 = await pool.token1();
  console.log("Token0:", token0);
  console.log("Token1:", token1);

  // Check if this is a WETH/MOR pool
  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  if ((token0 === wethAddress && token1 === morAddress) || (token0 === morAddress && token1 === wethAddress)) {
    console.log("This is a WETH/MOR pool");
  } else {
    console.log("Warning: This is not a WETH/MOR pool");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });