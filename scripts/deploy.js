async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // Address of the Uniswap V3 SwapRouter on the network (for local, use a mock or deploy it)
  const uniswapSwapRouterAddress = '0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e'; // Replace with actual address

  const TokenSwap = await ethers.getContractFactory('TokenSwap');
  
  // Pass the Uniswap V3 SwapRouter address to the TokenSwap constructor
  const tokenSwap = await TokenSwap.deploy(uniswapSwapRouterAddress);

  console.log('TokenSwap contract deployed to:', tokenSwap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
