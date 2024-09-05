const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Creating a pool with the account:', deployer.address);

  const factoryAddress = "0xD27889D6a7d1B7646e45BA92907228Ef706bda3A"; // Uniswap V3 Factory address
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD"; // MOR token on Sepolia
  const wethTokenAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5"; // WETHMockNEW token address
  const poolFee = 3000; // 0.3% fee tier

  const factoryABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../contracts/interfaces/IUniswapV3Factory.json'))).abi;

  const factoryContract = new ethers.Contract(factoryAddress, factoryABI, deployer);

  // Create the pool
  const tx = await factoryContract.createPool(morTokenAddress, wethTokenAddress, poolFee);
  const receipt = await tx.wait();

  console.log('Pool created successfully, transaction hash:', receipt.transactionHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

  
  