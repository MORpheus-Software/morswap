const { ethers } = require("hardhat");

async function getPoolState(poolAddress, provider) {
  const poolAbi = [
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function ticks(int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)"
  ];
  const pool = new ethers.Contract(poolAddress, poolAbi, provider);
  const liquidity = await pool.liquidity();
  const slot0 = await pool.slot0();
  const token0 = await pool.token0();
  const token1 = await pool.token1();
  const tickLower = await pool.ticks(Math.floor(slot0.tick / 60) * 60 - 60);
  const tickUpper = await pool.ticks(Math.ceil(slot0.tick / 60) * 60 + 60);
  return { liquidity, sqrtPriceX96: slot0.sqrtPriceX96, tick: slot0.tick, token0, token1, tickLower, tickUpper };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking pool state with the account:", deployer.address);

  const factoryAddress = "0xD27889D6a7d1B7646e45BA92907228Ef706bda3A";
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethTokenAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";

  // Check if pool exists
  console.log("Checking if MOR/WETH pool exists...");
  try {
    const factoryContract = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
    const poolAddress = await factoryContract.getPool(morTokenAddress, wethTokenAddress, 3000);
    console.log("MOR/WETH pool address:", poolAddress);

    if (poolAddress === '0x0000000000000000000000000000000000000000') {
      console.log("MOR/WETH pool doesn't exist.");
    } else {
      console.log("MOR/WETH pool exists.");
      
      // Get pool state
      const poolState = await getPoolState(poolAddress, ethers.provider);
      console.log("Pool liquidity:", poolState.liquidity.toString());
      console.log("Pool sqrtPriceX96:", poolState.sqrtPriceX96.toString());
      console.log("Pool tick:", poolState.tick.toString());
      console.log("Pool token0:", poolState.token0);
      console.log("Pool token1:", poolState.token1);
      console.log("Tick Lower liquidityGross:", poolState.tickLower.liquidityGross.toString());
      console.log("Tick Upper liquidityGross:", poolState.tickUpper.liquidityGross.toString());

      if (poolState.token0.toLowerCase() !== morTokenAddress.toLowerCase()) {
        console.log("Note: MOR is token1 in this pool, not token0");
      }
    }
  } catch (error) {
    console.error("Error checking pool:", error.message);
  }

  // Check token balances
  const morToken = await ethers.getContractAt("IERC20", morTokenAddress);
  const wethToken = await ethers.getContractAt("IERC20", wethTokenAddress);
  
  const morBalance = await morToken.balanceOf(deployer.address);
  const wethBalance = await wethToken.balanceOf(deployer.address);
  
  console.log("MOR balance:", ethers.utils.formatUnits(morBalance, 18));
  console.log("WETH balance:", ethers.utils.formatUnits(wethBalance, 18));

  // Check NFT position
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);
  const positionId = 737; // The NFT ID from the previous liquidity addition
  try {
    const position = await positionManager.positions(positionId);
    console.log("Position details:");
    console.log("  Token0:", position.token0);
    console.log("  Token1:", position.token1);
    console.log("  Fee:", position.fee.toString());
    console.log("  TickLower:", position.tickLower.toString());
    console.log("  TickUpper:", position.tickUpper.toString());
    console.log("  Liquidity:", position.liquidity.toString());
  } catch (error) {
    console.error("Error fetching position details:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });