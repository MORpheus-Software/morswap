const { ethers } = require("hardhat");

async function main() {
  const poolAddress = "0x4701D0A787dcE3b9A63e4a9AA00d94AFEA2d7ec5";
  const poolAbi = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() external view returns (uint128)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
  ];

  const pool = new ethers.Contract(poolAddress, poolAbi, ethers.provider);
  
  const [slot0, liquidity, token0, token1] = await Promise.all([
    pool.slot0(),
    pool.liquidity(),
    pool.token0(),
    pool.token1()
  ]);

  console.log("Pool address:", poolAddress);
  console.log("Current tick:", slot0.tick);
  console.log("Liquidity:", liquidity.toString());
  console.log("Token0 (WETH):", token0);
  console.log("Token1 (MOR):", token1);

  const sqrtPriceX96 = slot0.sqrtPriceX96;
  const price = (sqrtPriceX96 * sqrtPriceX96 * (10**18) / (2**192)).toString() / (10**18);
  console.log("Current price:", price, "MOR per WETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });