// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol';

contract TokenSwap {
    ISwapRouter public immutable swapRouter;
    IUniswapV3Factory public immutable factory;

    // Updated addresses based on the information from previous interactions
    address public constant MOR = 0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD; // MOR
    address public constant WETH = 0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5;    //WETH
    // Remove USDC if it's not part of your current setup
    // address public constant USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;    //

    uint24 public constant poolFee = 3000;

    constructor(ISwapRouter _swapRouter, IUniswapV3Factory _factory) {
        swapRouter = _swapRouter;
        factory = _factory;
    }

    function swapExactInputSingle(uint256 amountIn, address tokenIn, address tokenOut, uint24 _poolFee) external returns (uint256 amountOut) {
        require(tokenIn == MOR || tokenIn == WETH, "Invalid input token");
        require(tokenOut == MOR || tokenOut == WETH, "Invalid output token");
        require(tokenIn != tokenOut, "Input and output tokens must be different");

        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: _poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
        require(amountOut > 0, "Swap failed: no tokens received");
        return amountOut;
    }

    function swapExactOutputSingle(uint256 amountOut, uint256 amountInMaximum, address tokenIn, address tokenOut) external returns (uint256 amountIn) {
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountInMaximum);

        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountInMaximum);

        ISwapRouter.ExactOutputSingleParams memory params =
            ISwapRouter.ExactOutputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: 0
            });

        amountIn = swapRouter.exactOutputSingle(params);

        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(tokenIn, address(swapRouter), 0);
            TransferHelper.safeTransfer(tokenIn, msg.sender, amountInMaximum - amountIn);
        }
    }

    function checkPool() external view returns (address) {
        return factory.getPool(MOR, WETH, poolFee);
    }

    function createPool() external {
        factory.createPool(MOR, WETH, poolFee);
    }

    // Add this function to the TokenSwap contract
    function getFactoryAddress() external view returns (address) {
        return address(factory);
    }

    // Add this function to the TokenSwap contract
    function getPoolDirect() external view returns (address) {
        return IUniswapV3Factory(factory).getPool(MOR, WETH, poolFee);
    }
}
