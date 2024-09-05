async function main() {
  const [deployer] = await ethers.getSigners();

  // Get deployed TokenSwap contract
  const tokenSwap = await ethers.getContractAt("TokenSwap", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // MOR token on testnet
  const morTokenAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethTokenAddress = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"; // WETH testnet address

  // Amount of MOR to swap (1 MOR)
  const amountIn = ethers.utils.parseUnits("1", 18); // 18 decimals for MOR
  const recipient = deployer.address; // The address to receive WETH

  // Get the MOR token contract
  const morContract = await ethers.getContractAt("IERC20", morTokenAddress);

  // Step 2: Approve the TokenSwap contract to spend MOR tokens on behalf of deployer
  console.log("Approving MOR token transfer to TokenSwap contract...");
  const approveTx = await morContract.approve(tokenSwap.address, amountIn);
  await approveTx.wait();
  console.log("MOR token transfer approved!");

  // Step 3: Swap MOR to WETH
  console.log("Swapping MOR to WETH...");
  const tx = await tokenSwap.swapExactInputSingle(
    amountIn,
    morTokenAddress,
    wethTokenAddress
  );

  await tx.wait();
  console.log("MOR swapped to WETH!");

  // Check WETH balance
  const wethContract = await ethers.getContractAt("IERC20", wethTokenAddress);
  const wethBalance = await wethContract.balanceOf(deployer.address);
  console.log(`WETH balance after swap: ${ethers.utils.formatEther(wethBalance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
