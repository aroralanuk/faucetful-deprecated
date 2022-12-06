// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "forge-std/Test.sol";
import {MockHyperlaneEnvironment} from "@hyperlane-xyz/core/contracts/mock/MockHyperlaneEnvironment.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

import {FaucetfulERC20} from "../contracts/FaucetfulERC20.sol";

contract FaucetfulERC20Test is Test {
    using TypeCasts for bytes32;
    MockHyperlaneEnvironment internal testEnv;

    uint32 internal mainnetDomain = 0x657468;
    uint32 internal testnetDomain = 5;

    FaucetfulERC20 internal mainnetFETH;
    FaucetfulERC20 internal testnetFETH;

    function setUp() public  {
        testEnv = new MockHyperlaneEnvironment(mainnetDomain, testnetDomain);

        mainnetFETH = new FaucetfulERC20();
        testnetFETH = new FaucetfulERC20();


        mainnetFETH.initialize(
            address(testEnv.mailboxes(mainnetDomain)),
            address(testEnv.igps(mainnetDomain)),
            address(testEnv.isms(mainnetDomain)),
            "Faucetful Ether",
            "FETH"
        );
        testnetFETH.initialize(
            address(testEnv.mailboxes(testnetDomain)),
            address(testEnv.igps(testnetDomain)),
            address(testEnv.isms(testnetDomain)),
            "Faucetful Ether",
            "FETH"
        );

        mainnetFETH.enrollRemoteRouter(
            testnetDomain,
            TypeCasts.addressToBytes32(address(testnetFETH))
        );
        testnetFETH.enrollRemoteRouter(
            mainnetDomain,
            TypeCasts.addressToBytes32(address(mainnetFETH))
        );

        mainnetFETH.setMainnetRouter(address(mainnetFETH));
        testnetFETH.setMainnetRouter(address(mainnetFETH));

    }

    function testDepositMainnet() public {
        mainnetFETH.deposit{value: 1 ether}();
        assertEq(mainnetFETH.balanceOf(address(this)), 1 ether);
    }

    function testDepositMainnet_Call() public {
        (bool success, ) = address(mainnetFETH).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(mainnetFETH.balanceOf(address(this)), 1 ether);
    }

    function testDepositTestnet_Fail() public {
        vm.expectRevert("FaucetfulERC20: not mainnet token");
        testnetFETH.deposit{value: 1 ether}();
        assertEq(testnetFETH.balanceOf(address(this)), 0);
    }

    function testDepositTestnet_CallFail() public {
        vm.expectRevert("FaucetfulERC20: not mainnet token");
        (bool success, ) = address(testnetFETH).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(testnetFETH.balanceOf(address(this)), 0);
    }

    function testTransferRemote_Mainnet() public {
        mainnetFETH.deposit{value: 1 ether}();

        assertEq(mainnetFETH.balanceOf(address(this)), 1 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0);

        mainnetFETH.transferRemote(
            testnetDomain,
            TypeCasts.addressToBytes32(address(this)),
            1 ether
        );
        testEnv.processNextPendingMessage();

        assertEq(mainnetFETH.balanceOf(address(this)), 0);
        assertEq(testnetFETH.balanceOf(address(this)), 1 ether);

    }

    function testTransferRemote_Twice() public {
        mainnetFETH.deposit{value: 1 ether}();

        assertEq(mainnetFETH.balanceOf(address(this)), 1 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0);

        mainnetFETH.transferRemote(
            testnetDomain,
            TypeCasts.addressToBytes32(address(this)),
            0.6 ether
        );
        testEnv.processNextPendingMessage();

        assertEq(mainnetFETH.balanceOf(address(this)), 0.4 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0.6 ether);

        mainnetFETH.transferRemote(
            testnetDomain,
            TypeCasts.addressToBytes32(address(this)),
            0.25 ether
        );
        testEnv.processNextPendingMessage();

        assertEq(mainnetFETH.balanceOf(address(this)), 0.15 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0.85 ether);
    }

    function testTransferRemote_Roundabout() public {
        mainnetFETH.deposit{value: 1 ether}();

        assertEq(mainnetFETH.balanceOf(address(this)), 1 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0);

        mainnetFETH.transferRemote(
            testnetDomain,
            TypeCasts.addressToBytes32(address(this)),
            0.6 ether
        );
        testEnv.processNextPendingMessage();

        assertEq(mainnetFETH.balanceOf(address(this)), 0.4 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0.6 ether);

        testnetFETH.transferRemote(
            mainnetDomain,
            TypeCasts.addressToBytes32(address(this)),
            0.25 ether
        );
        testEnv.processNextPendingMessageFromDestination();

        assertEq(mainnetFETH.balanceOf(address(this)), 0.65 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0.35 ether);
    }

    function testWithdrawMainnet_Success() public {
        uint256 bal0 = address(this).balance;

        mainnetFETH.deposit{value: 1 ether}();

        assertEq(mainnetFETH.balanceOf(address(this)), 1 ether);

        mainnetFETH.withdraw(0.25 ether);

        uint256 bal1 = address(this).balance;

        assertEq(mainnetFETH.balanceOf(address(this)), 0.75 ether);
        assertEq(bal0 - bal1, 0.75 ether);
    }

    function testWithdrawMainnet_FailInsufficientFunds() public {
        mainnetFETH.deposit{value: 1 ether}();

        vm.expectRevert("FETH: Insufficient balance");
        mainnetFETH.withdraw(1.25 ether);
    }

    function testWithdrawTestnet_Fail() public {
        mainnetFETH.deposit{value: 1 ether}();

        assertEq(mainnetFETH.balanceOf(address(this)), 1 ether);
        assertEq(testnetFETH.balanceOf(address(this)), 0);

        mainnetFETH.transferRemote(
            testnetDomain,
            TypeCasts.addressToBytes32(address(this)),
            1 ether
        );
        testEnv.processNextPendingMessage();

        vm.expectRevert("FaucetfulERC20: not mainnet token");
        testnetFETH.withdraw(0.25 ether);

        assertEq(mainnetFETH.balanceOf(address(this)), 0);
        assertEq(testnetFETH.balanceOf(address(this)), 1 ether);
    }

    receive() external payable {}

}
