const { ethers } = require("hardhat");

async function main() {
  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);

  const token0 = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5"; // WETH Token address
  const token1 = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD"; // MOR Token address
  const fee = 3000; // 0.3%

  try {
    console.log("Querying pool...");
    const poolAddress = await factory.getPool(token0, token1, fee);
    console.log("Pool address:", poolAddress);

    if (poolAddress === ethers.constants.AddressZero) {
      console.log("Pool does not exist. Attempting to create pool...");
      const tx = await factory.createPool(token0, token1, fee);
      const receipt = await tx.wait();
      console.log("Pool created. Transaction hash:", receipt.transactionHash);
      
      // Query the pool address again
      const newPoolAddress = await factory.getPool(token0, token1, fee);
      console.log("New pool address:", newPoolAddress);
    } else {
      const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);
      const slot0 = await pool.slot0();
      console.log("Pool exists. Current tick:", slot0.tick.toString());
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.code) console.error("Error code:", error.code);
    if (error.data) console.error("Error data:", error.data);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });