const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log("Connected to network:", network.name, "(chainId:", network.chainId, ")");

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  const factoryAddress = "0xD27889D6a7d1B7646e45BA92907228Ef706bda3A";

  console.log("Attempting to connect to factory at:", factoryAddress);
  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);

  try {
    console.log("Calling owner() function...");
    const owner = await factory.owner();
    console.log("Factory owner:", owner);

    // Try to get a pool (even if it doesn't exist)
    const token0 = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5"; // WETH Token address
    const token1 = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD"; // MOR Token address
    const poolFee = 3000; // 0.3%

    console.log("Attempting to get pool...");
    const poolAddress = await factory.getPool(token0, token1, poolFee);
    console.log("Pool address:", poolAddress);

    if (poolAddress === ethers.constants.AddressZero) {
      console.log("Pool does not exist. Attempting to create...");
      const tx = await factory.createPool(token0, token1, poolFee);
      await tx.wait();
      console.log("Pool created. Transaction hash:", tx.hash);

      const newPoolAddress = await factory.getPool(token0, token1, poolFee);
      console.log("New pool address:", newPoolAddress);
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.error && error.error.message) {
      console.error("Error details:", error.error.message);
    }
  }

  // Check if contract exists at the address
  const code = await ethers.provider.getCode(factoryAddress);
  if (code === "0x") {
    console.error("No contract found at the specified address");
  } else {
    console.log("Contract code found at the specified address");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });