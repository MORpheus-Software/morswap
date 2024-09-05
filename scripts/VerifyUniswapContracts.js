const { ethers } = require("hardhat");

async function main() {
  // Use the factory address returned by the NonfungiblePositionManager
  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

  console.log("Verifying Uniswap V3 contracts...");

  try {
    const feeAmountTickSpacing = await factory.feeAmountTickSpacing(3000);
    console.log("Factory contract is responsive. Fee amount tick spacing for 0.3%:", feeAmountTickSpacing.toString());
  } catch (error) {
    console.error("Error interacting with factory contract:", error.message);
  }

  try {
    const factoryFromPositionManager = await positionManager.factory();
    console.log("NonfungiblePositionManager contract is responsive. Factory address:", factoryFromPositionManager);
  } catch (error) {
    console.error("Error interacting with NonfungiblePositionManager contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });