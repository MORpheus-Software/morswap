const { ethers } = require("hardhat");
const ISwapRouter02 = require('@uniswap/swap-router-contracts/artifacts/contracts/interfaces/ISwapRouter02.sol/ISwapRouter02.json');

async function estimateGas(signer, swapRouter02, params) {
  try {
    const gasEstimate = await swapRouter02.estimateGas.exactInputSingle(params);
    return gasEstimate.mul(120).div(100); // Add 20% buffer
  } catch (error) {
    console.error("Error estimating gas:", error.message);
    return ethers.BigNumber.from(1000000); // Fallback to a default value
  }
}

async function main() {
  const [signer] = await ethers.getSigners();

  // Token addresses
  const tt5Address = "0x1Bc0330e6922DE94Ac2D1e448d675F7a2f001AAD";
  const tt6Address = "0xD8393be00FE996F518C7b768333E74F3034C746D";

  // Contract addresses
  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e"; // UniswapV3Factory
  const swapRouter02Address = "0x101F443B4d1b059569D643917553c771E1b9663E"; // SwapRouter02

  console.log("Connected to network:", (await ethers.provider.getNetwork()).name);
  console.log("Signer address:", signer.address);
  console.log("Factory address:", factoryAddress);
  console.log("SwapRouter02 address:", swapRouter02Address);

  // Connect to contracts
  const tt5 = await ethers.getContractAt("TestToken", tt5Address);
  const tt6 = await ethers.getContractAt("TestToken", tt6Address);
  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
  const swapRouter02 = new ethers.Contract(swapRouter02Address, ISwapRouter02.abi, signer);

  // Amount to swap (1 TT5)
  const amountIn = ethers.utils.parseEther("1");

  // Approve the router to spend TT5
  console.log("Approving SwapRouter02 to spend TT5");
  const approveTx = await tt5.approve(swapRouter02Address, amountIn);
  await approveTx.wait();
  console.log("Approval transaction hash:", approveTx.hash);

  // Prepare swap parameters
  const params = {
    tokenIn: tt5Address,
    tokenOut: tt6Address,
    fee: 3000, // 0.3%
    recipient: signer.address,
    amountIn: amountIn,
    amountOutMinimum: 0, // Be careful with this in production!
    sqrtPriceLimitX96: 0 // We don't want to set a price limit
  };

  // Get latest gas prices
  const feeData = await ethers.provider.getFeeData();
  console.log("Current base fee:", ethers.utils.formatUnits(feeData.lastBaseFeePerGas, "gwei"), "gwei");
  console.log("Max priority fee:", ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, "gwei"), "gwei");

  // Calculate max fee per gas
  const maxFeePerGas = feeData.lastBaseFeePerGas.mul(2).add(feeData.maxPriorityFeePerGas);
  console.log("Calculated max fee per gas:", ethers.utils.formatUnits(maxFeePerGas, "gwei"), "gwei");

  // Estimate gas limit
  const estimatedGasLimit = await estimateGas(signer, swapRouter02, params);
  console.log("Estimated gas limit:", estimatedGasLimit.toString());

  // Execute the swap
  try {
    console.log("Executing swap...");
    const tx = await swapRouter02.exactInputSingle(params, {
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      gasLimit: estimatedGasLimit
    });
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Swap transaction hash:", receipt.transactionHash);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Get balances after swap
    const tt5BalanceAfter = await tt5.balanceOf(signer.address);
    const tt6BalanceAfter = await tt6.balanceOf(signer.address);
    console.log("TT5 balance after swap:", ethers.utils.formatEther(tt5BalanceAfter));
    console.log("TT6 balance after swap:", ethers.utils.formatEther(tt6BalanceAfter));

  } catch (error) {
    console.error("Swap failed:", error.message);
    if (error.transaction) {
      console.error("Transaction data:", error.transaction.data);
    }
    if (error.receipt) {
      console.error("Transaction receipt:", error.receipt);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });