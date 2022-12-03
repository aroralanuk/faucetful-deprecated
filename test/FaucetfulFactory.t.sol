// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import {Test} from "lib/forge-std/src/Test.sol";

import {FaucetfulFactory} from "../contracts/FaucetfulFactory.sol";
import {FaucetfulERC20} from "../contracts/FaucetfulERC20.sol";

import {IWETH9} from "./helpers/IWETH9.sol";

contract FaucetfulFactoryTest is Test {
    uint256 goerliFork;

    address public constant GOERLI_UNISWAP_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address public constant GOERLI_UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant GOERLI_WETH = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;

    address public constant GOERLI_ACM = 0x01812D60958798695391dacF092BAc4a715B1718;
    address public constant GOERLI_IGP = 0x44b764045BfDC68517e10e783E69B376cef196B2;


    IWETH9 public weth;
    FaucetfulFactory public factory;
    FaucetfulERC20 public feth;

    function setUp() public {

        weth = IWETH9(GOERLI_WETH);

        feth = new FaucetfulERC20();
        feth.initialize(
            GOERLI_ACM,
            GOERLI_IGP,
            0,
            "Faucetful Ether",
            "FETH"
        );

        factory = new FaucetfulFactory(
            GOERLI_UNISWAP_V3_FACTORY,
            GOERLI_UNISWAP_ROUTER
        );

        factory.setMainnetToken(GOERLI_WETH);
        factory.setTestnetToken(address(feth));
    }

    function testCreatePool() public {
        uint256 amount = 1000;
        weth.deposit{value: amount}();
        weth.transfer(address(factory), amount);

        factory.createUniV3Pool();
    }
}
