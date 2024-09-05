const { ethers } = require("hardhat");

async function main() {
  const poolAddress = "0x9Afc054C5B54a01879eAe99A21cd133772C38422";
  const poolAbi = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function ticks(int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)"
  ];

  const pool = new ethers.Contract(poolAddress, poolAbi, ethers.provider);
  const { tick } = await pool.slot0();
  console.log("Current tick:", tick);

  const ticksToCheck = [-79200, -67000, -59000];
  for (const checkTick of ticksToCheck) {
    try {
      const { liquidityGross, liquidityNet, initialized } = await pool.ticks(checkTick);
      console.log(`Tick ${checkTick}: Liquidity Gross: ${liquidityGross}, Liquidity Net: ${liquidityNet}, Initialized: ${initialized}`);
    } catch (error) {
      console.log(`Error checking tick ${checkTick}: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });