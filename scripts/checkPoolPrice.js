const { ethers } = require("hardhat");

async function main() {
  const poolAddress = "0xCb07e11282F970F6c52DbFa25101a4d0C99e9d34";
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  const slot0 = await pool.slot0();
  const sqrtPriceX96 = slot0.sqrtPriceX96;
  
  // Calculate price as a decimal
  const price = (sqrtPriceX96 * sqrtPriceX96 * (10**18) / (2**192)) / (10**18);

  console.log("Current tick:", slot0.tick.toString());
  console.log("Current price (MOR per WETH):", price.toFixed(18));
  console.log("Current price (WETH per MOR):", (1 / price).toFixed(18));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });