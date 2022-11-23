// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

contract FaucetfulFactory {
    IUniswapV3Factory public immutable uniswapV3Factory;

    address public pool;

    constructor(IUniswapV3Factory _uniswapV3Factory) {
        uniswapV3Factory = _uniswapV3Factory;
    }

    /// @notice Creates a UniswapV3 pool for the given two tokens and fee
    /// @dev 500 tick is 0.3% fee tier
    /// @param tokenMainnet FaucetfulERC20 token address on testnet
    /// @param tokenTestnet IWETH9 token address on testnet
    /// @return pool The address of the newly created pool
    function createUniV3Pool(
        address tokenMainnet,
        address tokenTestnet
    ) public returns (address pool) {
        pool = uniswapV3Factory.createPool(tokenMainnet, tokenTestnet, 3000);
    }
}
