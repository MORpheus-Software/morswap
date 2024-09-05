const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with the account:", deployer.address);

  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
  const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

  const token0 = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD"; // MOR Token address
  const token1 = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5"; // WETH Token address
  const poolFee = 3000; // 0.3%

  // Check balances
  const mor = await ethers.getContractAt("IERC20", token0);
  const weth = await ethers.getContractAt("IERC20", token1);
  const morBalance = await mor.balanceOf(deployer.address);
  const wethBalance = await weth.balanceOf(deployer.address);
  console.log("MOR balance:", ethers.utils.formatUnits(morBalance, 18));
  console.log("WETH balance:", ethers.utils.formatUnits(wethBalance, 18));

  // Approve tokens for transfer
  const amount0ToAdd = ethers.utils.parseUnits("1000", 18); // 1000 MOR
  const amount1ToAdd = ethers.utils.parseUnits("1", 18); // 1 WETH

  console.log("Approving tokens for transfer...");
  await mor.approve(nonfungiblePositionManagerAddress, amount0ToAdd);
  await weth.approve(nonfungiblePositionManagerAddress, amount1ToAdd);
  console.log("Tokens approved.");

  // Check allowances
  const morAllowance = await mor.allowance(deployer.address, nonfungiblePositionManagerAddress);
  const wethAllowance = await weth.allowance(deployer.address, nonfungiblePositionManagerAddress);
  console.log("MOR Allowance:", ethers.utils.formatUnits(morAllowance, 18));
  console.log("WETH Allowance:", ethers.utils.formatUnits(wethAllowance, 18));

  // Add liquidity
  const tickLower = -887220; // Corresponds to a price of 0.0005 MOR/WETH
  const tickUpper = 887220;  // Corresponds to a price of 2000 MOR/WETH

  const mintParams = {
    token0: token0,
    token1: token1,
    fee: poolFee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: amount0ToAdd,
    amount1Desired: amount1ToAdd,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now
  };

  console.log("Adding liquidity...");
  try {
    const tx = await positionManager.mint(mintParams, { gasLimit: 5000000 });
    const receipt = await tx.wait();
    console.log("Liquidity added successfully. Transaction hash:", receipt.transactionHash);
  } catch (error) {
    console.error("Failed to add liquidity:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
