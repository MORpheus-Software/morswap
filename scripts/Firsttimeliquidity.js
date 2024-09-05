const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Recreating pool and adding liquidity with account:", deployer.address);

  // Contract addresses
  const factoryAddress = "0xD27889D6a7d1B7646e45BA92907228Ef706bda3A";
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";

  // Get contract instances
  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
  const nonfungiblePositionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);
  const mor = await ethers.getContractAt("IERC20", morAddress);
  const weth = await ethers.getContractAt("IERC20", wethAddress);

  // Pool parameters
  const fee = 3000; // 0.3%

  // 1. Create the pool
  console.log("Creating pool...");
  await factory.createPool(morAddress, wethAddress, fee);
  console.log("Pool created");

  // 2. Get the pool address
  const poolAddress = await factory.getPool(morAddress, wethAddress, fee);
  console.log("Pool Address:", poolAddress);

  // 3. Initialize the pool
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);
  console.log("Initializing pool...");
  const initialPrice = ethers.utils.parseUnits("0.001", 18); // Adjust this value based on the desired initial price ratio of MOR/WETH
  await pool.initialize(initialPrice);
  console.log("Pool initialized");

  // 4. Approve tokens for NonfungiblePositionManager
  const amount0ToAdd = ethers.utils.parseUnits("1000", 18); // 1000 MOR
  const amount1ToAdd = ethers.utils.parseUnits("1", 18); // 1 WETH

  console.log("Approving MOR...");
  await mor.approve(nonfungiblePositionManagerAddress, amount0ToAdd);
  console.log("MOR approved");

  console.log("Approving WETH...");
  await weth.approve(nonfungiblePositionManagerAddress, amount1ToAdd);
  console.log("WETH approved");

  // 5. Add liquidity
  console.log("Adding liquidity...");
  const tickLower = -887220; // Corresponds to a price of 0.0005 MOR/WETH
  const tickUpper = 887220;  // Corresponds to a price of 2000 MOR/WETH
  const slippageTolerance = 50; // 0.5%

  const amount0Min = amount0ToAdd.mul(10000 - slippageTolerance).div(10000);
  const amount1Min = amount1ToAdd.mul(10000 - slippageTolerance).div(10000);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  const mintParams = {
    token0: morAddress,
    token1: wethAddress,
    fee: fee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: amount0ToAdd,
    amount1Desired: amount1ToAdd,
    amount0Min: amount0Min,
    amount1Min: amount1Min,
    recipient: deployer.address,
    deadline: deadline
  };

  const tx = await nonfungiblePositionManager.mint(mintParams);
  const receipt = await tx.wait();
  console.log("Liquidity added. Transaction hash:", receipt.transactionHash);

  // 6. Check pool state
  const slot0 = await pool.slot0();
  console.log("Current tick:", slot0.tick.toString());
  console.log("Current sqrt price:", slot0.sqrtPriceX96.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });