const { ethers } = require("hardhat");

async function main() {
  const poolAddress = "0x9Afc054C5B54a01879eAe99A21cd133772C38422";
  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";

  const poolAbi = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() external view returns (uint128)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function positions(bytes32 key) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
  ];

  const pool = new ethers.Contract(poolAddress, poolAbi, ethers.provider);
  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);

  const [slot0, liquidity, token0, token1, wethBalance, morBalance] = await Promise.all([
    pool.slot0(),
    pool.liquidity(),
    pool.token0(),
    pool.token1(),
    weth.balanceOf(poolAddress),
    mor.balanceOf(poolAddress)
  ]);

  console.log("Current tick:", slot0.tick.toString());
  console.log("Liquidity:", liquidity.toString());
  console.log("Token0 (WETH):", token0);
  console.log("Token1 (MOR):", token1);
  console.log("WETH balance in pool:", ethers.utils.formatEther(wethBalance));
  console.log("MOR balance in pool:", ethers.utils.formatEther(morBalance));

  const price = (slot0.sqrtPriceX96 * slot0.sqrtPriceX96 * (10**18) / (2**192)).toString();
  console.log(`Current price: ${price} ${token0 === wethAddress ? "MOR per WETH" : "WETH per MOR"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });