const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  const routerAddress = "0x101F443B4d1b059569D643917553c771E1b9663E";
  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e"; // Uniswap V3 Factory

  const factoryABI = [
    "function owner() external view returns (address)",
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
  ];

  const erc20ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
  ];

  const poolABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];

  console.log("Checking Factory contract...");
  const factory = new ethers.Contract(factoryAddress, factoryABI, signer);
  try {
    const factoryOwner = await factory.owner();
    console.log("Factory owner:", factoryOwner);
  } catch (error) {
    console.error("Error accessing Factory contract:", error.message);
  }

  console.log("\nChecking WETH token...");
  const weth = new ethers.Contract(wethAddress, erc20ABI, signer);
  try {
    const wethName = await weth.name();
    const wethSymbol = await weth.symbol();
    const wethDecimals = await weth.decimals();
    console.log("WETH Name:", wethName);
    console.log("WETH Symbol:", wethSymbol);
    console.log("WETH Decimals:", wethDecimals);
  } catch (error) {
    console.error("Error accessing WETH contract:", error.message);
  }

  console.log("\nChecking MOR token...");
  const mor = new ethers.Contract(morAddress, erc20ABI, signer);
  try {
    const morName = await mor.name();
    const morSymbol = await mor.symbol();
    const morDecimals = await mor.decimals();
    console.log("MOR Name:", morName);
    console.log("MOR Symbol:", morSymbol);
    console.log("MOR Decimals:", morDecimals);
  } catch (error) {
    console.error("Error accessing MOR contract:", error.message);
  }

  console.log("\nChecking for pool...");
  try {
    const poolAddress = await factory.getPool(morAddress, wethAddress, 3000); // 0.3% fee tier
    console.log("Pool address:", poolAddress);
  } catch (error) {
    console.error("Error checking for pool:", error.message);
  }

  const fees = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

  for (const fee of fees) {
    console.log(`Checking for pool with fee ${fee/10000}%`);
    const poolAddress = await factory.getPool(morAddress, wethAddress, fee);
    
    if (poolAddress === ethers.constants.AddressZero) {
      console.log(`No pool found for fee ${fee/10000}%`);
      continue;
    }

    console.log(`Pool found at ${poolAddress}`);
    const pool = new ethers.Contract(poolAddress, poolABI, signer);

    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const poolFee = await pool.fee();
    const liquidity = await pool.liquidity();
    const slot0 = await pool.slot0();

    console.log(`Token0: ${token0}`);
    console.log(`Token1: ${token1}`);
    console.log(`Pool fee: ${poolFee}`);
    console.log(`Liquidity: ${liquidity.toString()}`);
    console.log(`sqrt Price X96: ${slot0.sqrtPriceX96.toString()}`);
    console.log(`Tick: ${slot0.tick}`);
    console.log('---');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });