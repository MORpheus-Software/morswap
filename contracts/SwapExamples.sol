// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

contract SwapExamples {
    ISwapRouter public immutable swapRouter;

    address public constant MOR = 0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD;
    address public constant WETH = 0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5;

    // For this example, we will set the pool fee to 0.3%.
    uint24 public constant poolFee = 3000;

    constructor(ISwapRouter _swapRouter) {
        swapRouter = _swapRouter;
    }

    /// @notice swapExactInputSingle swaps a fixed amount of MOR for a maximum possible amount of WETH
    /// using the MOR/WETH 0.3% pool by calling `exactInputSingle` in the swap router.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its MOR for this function to succeed.
    /// @param amountIn The exact amount of MOR that will be swapped for WETH.
    /// @return amountOut The amount of WETH received.
    function swapExactInputSingle(uint256 amountIn) external returns (uint256 amountOut) {
        // Transfer the specified amount of MOR to this contract.
        TransferHelper.safeTransferFrom(MOR, msg.sender, address(this), amountIn);

        // Approve the router to spend MOR.
        TransferHelper.safeApprove(MOR, address(swapRouter), amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: MOR,
                tokenOut: WETH,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }

    /// @notice swapExactOutputSingle swaps a minimum possible amount of MOR for a fixed amount of WETH.
    /// @dev The calling address must approve this contract to spend its MOR for this function to succeed. As the amount of input MOR is variable,
    /// the calling address will need to approve for a slightly higher amount, anticipating some variance.
    /// @param amountOut The exact amount of WETH to receive from the swap.
    /// @param amountInMaximum The amount of MOR we are willing to spend to receive the specified amount of WETH.
    /// @return amountIn The amount of MOR actually spent in the swap.
    function swapExactOutputSingle(uint256 amountOut, uint256 amountInMaximum) external returns (uint256 amountIn) {
        // Transfer the specified amount of MOR to this contract.
        TransferHelper.safeTransferFrom(MOR, msg.sender, address(this), amountInMaximum);

        // Approve the router to spend the specified `amountInMaximum` of MOR.
        // In production, you should choose the maximum amount to spend based on oracles or other data sources to achieve a better swap.
        TransferHelper.safeApprove(MOR, address(swapRouter), amountInMaximum);

        ISwapRouter.ExactOutputSingleParams memory params =
            ISwapRouter.ExactOutputSingleParams({
                tokenIn: MOR,
                tokenOut: WETH,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: 0
            });

        // Executes the swap returning the amountIn needed to spend to receive the desired amountOut.
        amountIn = swapRouter.exactOutputSingle(params);

        // For exact output swaps, the amountInMaximum may not have all been spent.
        // If the actual amount spent (amountIn) is less than the specified maximum amount, we must refund the msg.sender and approve the swapRouter to spend 0.
        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(MOR, address(swapRouter), 0);
            TransferHelper.safeTransfer(MOR, msg.sender, amountInMaximum - amountIn);
        }
    }
}