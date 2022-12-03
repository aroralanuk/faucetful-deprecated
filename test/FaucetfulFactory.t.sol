// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import {Test} from "lib/forge-std/src/Test.sol";
import "forge-std/vm.sol";
import "forge-std/console.sol";

// import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";

import {FaucetfulFactory} from "../contracts/FaucetfulFactory.sol";
import {FaucetfulERC20} from "../contracts/FaucetfulERC20.sol";

import {IWETH9} from "./helpers/IWETH9.sol";

contract FaucetfulFactoryTest is Test {
    uint256 testnetFork;
    uint256 pk;

    address public constant GOERLI_UNISWAP_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address public constant GOERLI_UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant GOERLI_WETH = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;

    address public constant GOERLI_ACM = 0x01812D60958798695391dacF092BAc4a715B1718;
    address public constant GOERLI_IGP = 0x44b764045BfDC68517e10e783E69B376cef196B2;


    IWETH9 public weth;
    FaucetfulFactory public factory;
    FaucetfulERC20 public feth;

    function setUp() public {
        string memory goerliRPC = vm.envString("GOERLI_RPC_URL");
        pk = vm.envUint("PRIVATE_KEY");
        testnetFork = vm.createFork(goerliRPC);

        // select the fork
        vm.selectFork(testnetFork);
        vm.startBroadcast(pk);

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

    function testFork() public {
        assertEq(vm.activeFork(), testnetFork);
    }

    function testCreatePool() public {
        bytes32 POOL_INIT_CODE_HASH = 0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

        address expPoolAddr;
        bytes32 calcPool = keccak256(

            abi.encodePacked(
                hex"ff",
                GOERLI_UNISWAP_V3_FACTORY,
                keccak256(abi.encode(address(feth), GOERLI_WETH, 3000)),
                POOL_INIT_CODE_HASH
            )
        );

        assembly {
            mstore(0x0, calcPool)
            expPoolAddr := mload(0x0)
        }

        address pool = factory.createUniV3Pool();
        assertEq(pool, expPoolAddr);

        vm.stopBroadcast();
    }

    function testProvidityLiquidity() public {

    }
}
