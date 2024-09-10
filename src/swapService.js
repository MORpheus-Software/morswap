import { ethers } from 'ethers';
import ISwapRouter02 from '@uniswap/swap-router-contracts/artifacts/contracts/interfaces/ISwapRouter02.sol/ISwapRouter02.json';

const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
const wethAddress = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E";
const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
const swapRouter02Address = "0x101F443B4d1b059569D643917553c771E1b9663E";

async function estimateGas(signer, swapRouter02, params) {
  try {
    const gasEstimate = await swapRouter02.estimateGas.exactInputSingle(params);
    return gasEstimate.mul(120).div(100); // Add 20% buffer
  } catch (error) {
    console.error("Error estimating gas:", error.message);
    return ethers.BigNumber.from(1000000); // Fallback to a default value
  }
}

export async function performSwap(walletClient, amountInString, tokenIn, tokenOut) {
  const provider = new ethers.providers.Web3Provider(walletClient);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  console.log("Connected to network:", (await provider.getNetwork()).name);
  console.log("Signer address:", address);
  console.log("Factory address:", factoryAddress);
  console.log("SwapRouter02 address:", swapRouter02Address);

  // Connect to contracts
  const mor = new ethers.Contract(morAddress, ["function approve(address spender, uint256 amount) public returns (bool)", "function balanceOf(address account) public view returns (uint256)"], signer);
  const weth = new ethers.Contract(wethAddress, ["function approve(address spender, uint256 amount) public returns (bool)", "function balanceOf(address account) public view returns (uint256)"], signer);
  const factory = new ethers.Contract(factoryAddress, ["function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"], signer);
  const swapRouter02 = new ethers.Contract(swapRouter02Address, ISwapRouter02.abi, signer);

  const amountIn = ethers.utils.parseUnits(amountInString, 18);

  // Check token balance
  const tokenToApprove = tokenIn === morAddress ? mor : weth;
  const balance = await tokenToApprove.balanceOf(address);
  console.log(`Token balance: ${ethers.utils.formatEther(balance)} ${tokenIn === morAddress ? 'MOR' : 'WETH'}`);
  if (balance.lt(amountIn)) {
    throw new Error("Insufficient token balance");
  }

  // Approve the router to spend tokens
  console.log(`Approving SwapRouter02 to spend ${ethers.utils.formatEther(amountIn)} of token ${tokenIn}`);
  const approveTx = await tokenToApprove.approve(swapRouter02Address, amountIn);
  await approveTx.wait();
  console.log("Approval transaction hash:", approveTx.hash);

  // Check if the pool exists and has liquidity
  const poolAddress = await factory.getPool(tokenIn, tokenOut, 3000);
  if (poolAddress === ethers.constants.AddressZero) {
    throw new Error("Pool does not exist for the given token pair and fee");
  }

  const pool = new ethers.Contract(poolAddress, ["function liquidity() external view returns (uint128)"], provider);
  const liquidity = await pool.liquidity();
  if (liquidity.eq(0)) {
    throw new Error("Pool has no liquidity");
  }

  console.log("Pool address:", poolAddress);
  console.log("Pool liquidity:", ethers.utils.formatEther(liquidity));

  // Prepare swap parameters
  const params = {
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    fee: 3000, // 0.3%
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountIn: amountIn,
    amountOutMinimum: 0, // Risky!
    sqrtPriceLimitX96: 0 // No price limit set
  };

  // Get latest gas prices
  const feeData = await provider.getFeeData();
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
    const morBalanceAfter = await mor.balanceOf(address);
    const wethBalanceAfter = await weth.balanceOf(address);
    console.log("MOR balance after swap:", ethers.utils.formatEther(morBalanceAfter));
    console.log("WETH balance after swap:", ethers.utils.formatEther(wethBalanceAfter));

    return receipt;
  } catch (error) {
    console.error("Swap failed:", error.message);
    if (error.transaction) {
      console.error("Transaction data:", error.transaction.data);
    }
    if (error.receipt) {
      console.error("Transaction receipt:", error.receipt);
    }
    throw error;
  }
}