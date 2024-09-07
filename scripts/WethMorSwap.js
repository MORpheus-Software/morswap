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
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethAddress = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E";

  // Contract addresses
  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e"; // UniswapV3Factory
  const swapRouter02Address = "0x101F443B4d1b059569D643917553c771E1b9663E"; // SwapRouter02

  console.log("Connected to network:", (await ethers.provider.getNetwork()).name);
  console.log("Signer address:", signer.address);
  console.log("Factory address:", factoryAddress);
  console.log("SwapRouter02 address:", swapRouter02Address);

  // Connect to contracts
  const mor = await ethers.getContractAt("IERC20", morAddress);
  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
  const swapRouter02 = new ethers.Contract(swapRouter02Address, ISwapRouter02.abi, signer);

  // Amount to swap (0.0001 WETH)
  const amountIn = ethers.utils.parseEther("0.0001");

  // Approve the router to spend WETH
  console.log("Approving SwapRouter02 to spend WETH");
  const approveTx = await weth.approve(swapRouter02Address, amountIn);
  await approveTx.wait();
  console.log("Approval transaction hash:", approveTx.hash);

  // Prepare swap parameters
  const params = {
    tokenIn: wethAddress,
    tokenOut: morAddress,
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
    const morBalanceAfter = await mor.balanceOf(signer.address);
    const wethBalanceAfter = await weth.balanceOf(signer.address);
    console.log("MOR balance after swap:", ethers.utils.formatEther(morBalanceAfter));
    console.log("WETH balance after swap:", ethers.utils.formatEther(wethBalanceAfter));

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