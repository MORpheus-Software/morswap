// src/swapService.js
import { ethers } from 'ethers';

const poolAddress = "0xe49D59f17Eb401fB66681F6095d7DB3bE0CdAb8b";
const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
const swapRouterAddress = "0x101F443B4d1b059569D643917553c771E1b9663E";

export async function performSwap(walletClient, amountIn) {
  const provider = new ethers.providers.Web3Provider(walletClient);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  const pool = new ethers.Contract(poolAddress, ["function liquidity() view returns (uint128)"], provider);
  const swapRouterABI = [
    "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
  ];

  const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterABI, signer);
  const weth = new ethers.Contract(wethAddress, ["function balanceOf(address) view returns (uint256)", "function approve(address,uint256) returns (bool)", "function allowance(address,address) view returns (uint256)"], signer);
  const mor = new ethers.Contract(morAddress, ["function balanceOf(address) view returns (uint256)"], provider);

  console.log("Pool liquidity before swap:", (await pool.liquidity()).toString());

  const wethBalance = await weth.balanceOf(address);
  console.log("WETH balance before swap:", ethers.utils.formatUnits(wethBalance, 18));

  // Approve the router to spend tokens
  console.log("Approving WETH...");
  const approveTx = await weth.approve(swapRouterAddress, amountIn);
  await approveTx.wait();
  console.log("WETH approved");

  const allowance = await weth.allowance(address, swapRouterAddress);
  console.log("SwapRouter allowance:", ethers.utils.formatUnits(allowance, 18));

  const params = {
    tokenIn: wethAddress,
    tokenOut: morAddress,
    fee: 3000,
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0
  };

  console.log("Swap params:", JSON.stringify(params, null, 2));

  if (!ethers.utils.isAddress(params.tokenIn)) {
    console.error("Invalid tokenIn address:", params.tokenIn);
  }
  if (!ethers.utils.isAddress(params.tokenOut)) {
    console.error("Invalid tokenOut address:", params.tokenOut);
  }
  if (!ethers.utils.isAddress(params.recipient)) {
    console.error("Invalid recipient address:", params.recipient);
  }

  console.log("SwapRouter ABI:", JSON.stringify(swapRouter.interface.fragments, null, 2));

  console.log("Performing swap...");
  try {
    const gasLimit = 500000;
    const gasPrice = await provider.getGasPrice();
    console.log("Gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");

    const tx = await swapRouter.exactInputSingle(
      [
        params.tokenIn,
        params.tokenOut,
        params.fee,
        params.recipient,
        params.deadline,
        params.amountIn,
        params.amountOutMinimum,
        params.sqrtPriceLimitX96
      ],
      { gasLimit, gasPrice }
    );

    console.log("Swap transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("Swap completed. Transaction hash:", receipt.transactionHash);
    console.log("Gas used:", receipt.gasUsed.toString());

    console.log("Pool liquidity after swap:", (await pool.liquidity()).toString());

    const wethBalanceAfter = await weth.balanceOf(address);
    const morBalance = await mor.balanceOf(address);
    console.log("WETH balance after:", ethers.utils.formatUnits(wethBalanceAfter, 18));
    console.log("MOR balance:", ethers.utils.formatUnits(morBalance, 18));

    return receipt;
  } catch (error) {
    console.error("Swap failed:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error arguments:", error.arguments);
    if (error.transaction) {
      console.log("Failed transaction:", error.transaction);
    }
    throw error;
  }
}