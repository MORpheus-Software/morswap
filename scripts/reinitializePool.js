const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Reinitializing pool with account:", deployer.address);

  const poolAddress = "0xCb07e11282F970F6c52DbFa25101a4d0C99e9d34";
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  // Set an initial price of 1 MOR = 0.0001 WETH (adjust as needed)
  const initialSqrtPriceX96 = ethers.BigNumber.from("79228162514264337593543950336");
  
  try {
    const tx = await pool.initialize(initialSqrtPriceX96, { gasLimit: 3000000 });
    await tx.wait();
    console.log("Pool reinitialized successfully.");
  } catch (error) {
    console.error("Failed to reinitialize pool:", error.message);
  }

  // Check the pool state after reinitialization attempt
  const newSlot0 = await pool.slot0();
  console.log("Current tick:", newSlot0.tick.toString());
  console.log("Current sqrt price:", newSlot0.sqrtPriceX96.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });