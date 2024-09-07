const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);

  const DEPLOYED_CONTRACT_ADDRESS = "0xe3e8c117c0129DF55F0cdFE3c8d28c51BdEFF0D7";
  const SwapTT5TT6 = await ethers.getContractFactory("SwapTT5TT6");
  const swapTT5TT6 = SwapTT5TT6.attach(DEPLOYED_CONTRACT_ADDRESS);

  const TT5_ADDRESS = "0x1Bc0330e6922DE94Ac2D1e448d675F7a2f001AAD";
  const TT6_ADDRESS = "0xD8393be00FE996F518C7b768333E74F3034C746D";
  const POOL_FEE = 3000; // 0.3%

  const amountToSwap = "0.1";
  const amountInWei = ethers.utils.parseEther(amountToSwap);

  console.log(`Approving ${amountToSwap} TT5...`);
  const TT5 = await ethers.getContractAt("IERC20", TT5_ADDRESS);
  const approveTx = await TT5.connect(signer).approve(DEPLOYED_CONTRACT_ADDRESS, amountInWei);
  await approveTx.wait();
  console.log("Approval transaction hash:", approveTx.hash);

  // Prepare the swap parameters
  const path = ethers.utils.solidityPack(
    ['address', 'uint24', 'address'],
    [TT5_ADDRESS, POOL_FEE, TT6_ADDRESS]
  );

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
  const minAmountOut = 0; // Set this to a reasonable value to protect against slippage

  const universalRouterCalldata = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'address', 'uint256', 'uint256', 'uint256'],
    [path, signer.address, deadline, amountInWei, minAmountOut]
  );

  console.log(`Swapping ${amountToSwap} TT5 for TT6...`);
  try {
    const swapTx = await swapTT5TT6.swapTT5TT6(amountInWei, universalRouterCalldata, { gasLimit: 1000000 });
    console.log("Swap transaction sent. Waiting for confirmation...");
    const receipt = await swapTx.wait();
    console.log("Swap completed. Transaction hash:", swapTx.hash);

    const tt5BalanceAfter = await TT5.balanceOf(signer.address);
    console.log("TT5 balance after swap:", ethers.utils.formatEther(tt5BalanceAfter));

    const TT6 = await ethers.getContractAt("IERC20", TT6_ADDRESS);
    const tt6BalanceAfter = await TT6.balanceOf(signer.address);
    console.log("TT6 balance after swap:", ethers.utils.formatEther(tt6BalanceAfter));
  } catch (error) {
    console.error("Swap failed:", error.message);
    if (error.data) {
      try {
        const decodedError = SwapTT5TT6.interface.parseError(error.data);
        console.error("Decoded error:", decodedError.name, decodedError.args);
      } catch (decodeError) {
        console.error("Failed to decode error data:", decodeError.message);
      }
    }
    console.error("Full error object:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });