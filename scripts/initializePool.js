const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking pool with the account:", deployer.address);

  const poolAddress = "0xCb07e11282F970F6c52DbFa25101a4d0C99e9d34";
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethTokenAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";

  const poolAbi = [
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function initialize(uint160 sqrtPriceX96) external"
  ];
  const pool = new ethers.Contract(poolAddress, poolAbi, deployer);

  console.log("Checking pool state:");
  let state = await pool.slot0();
  console.log("  sqrtPriceX96:", state.sqrtPriceX96.toString());
  console.log("  tick:", state.tick.toString());
  console.log("  liquidity:", (await pool.liquidity()).toString());

  if (state.sqrtPriceX96.eq(0)) {
    console.log("Pool is not initialized. Attempting to initialize...");
    const initialPrice = ethers.BigNumber.from(10).pow(18); // 1 WETH = 1 MOR
    const sqrtPriceX96 = ethers.BigNumber.from(initialPrice).shl(96).div(ethers.BigNumber.from(2).pow(96));
    
    try {
      const tx = await pool.initialize(sqrtPriceX96, { gasLimit: 500000 });
      await tx.wait();
      console.log("Pool initialized successfully");
    } catch (error) {
      console.error("Failed to initialize pool:", error.message);
    }

    console.log("Pool state after initialization attempt:");
    state = await pool.slot0();
    console.log("  sqrtPriceX96:", state.sqrtPriceX96.toString());
    console.log("  tick:", state.tick.toString());
    console.log("  liquidity:", (await pool.liquidity()).toString());
  } else {
    console.log("Pool is already initialized");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });