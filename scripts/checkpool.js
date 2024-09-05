const { ethers } = require("hardhat");

async function main() {
  const poolAddress = "0xCb07e11282F970F6c52DbFa25101a4d0C99e9d34";
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  const slot0 = await pool.slot0();
  console.log("Slot0:", slot0);

  const liquidity = await pool.liquidity();
  console.log("Liquidity:", liquidity.toString());

  const fee = await pool.fee();
  console.log("Fee:", fee);

  const token0 = await pool.token0();
  const token1 = await pool.token1();
  console.log("Token0:", token0);
  console.log("Token1:", token1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });