// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";


contract FaucetfulFactory is Ownable {
    address public tokenMainnet;
    address public tokenTestnet;
    uint24 public constant poolFee = 3000;
    address public pool;

    IUniswapV3Factory public immutable uniswapV3Factory;
    ISwapRouter public immutable swapRouter;

    constructor(address uniswapV3Factory_, address swapRouter_) {
        uniswapV3Factory = IUniswapV3Factory(uniswapV3Factory_);
        swapRouter = ISwapRouter(swapRouter_);
    }

    function setMainnetToken(address tokenMainnet_) external onlyOwner {
        tokenMainnet = tokenMainnet_;
    }

    function seTestnetToken(address tokenTestnet_) external onlyOwner {
        tokenTestnet = tokenTestnet_;
    }

    /// @notice Creates a UniswapV3 pool for the given two tokens and fee
    /// @dev 500 tick is 0.3% fee tier
    function createUniV3Pool() external onlyOwner {
        pool = uniswapV3Factory.createPool(tokenMainnet, tokenTestnet, poolFee);
    }


    /// @notice swapExactInputSingle swaps a fixed amount of mainnetToken for a maximum possible amount of testnetToken or vice versa
    /// using the tMainnet/tTestnet 0.3% pool by calling `exactInputSingle` in the swap router.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its  for this function to succeed.
    /// @param amountIn The exact amount of DAI that will be swapped for WETH9.
    /// @return amountOut The amount of WETH9 received.
    function swapExactInputSingle(bool zeroForOne, uint256 amountIn) external returns (uint256 amountOut) {
        address tokenIn = zeroForOne ? tokenMainnet : tokenTestnet;
        address tokenOut = zeroForOne ? tokenTestnet : tokenMainnet;

        // msg.sender must approve this contract

        // Transfer the specified amount of DAI to this contract.
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        // Approve the router to spend DAI.
        // TODO: one step approval
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
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
}
