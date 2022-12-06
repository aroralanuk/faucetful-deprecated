// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import {TokenRouter} from "./lib/TokenRouter.sol";

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 * @title Hyperlane Token that extends the ERC20 token standard to enable native interchain transfers.
 * @author Abacus Works
 * @dev Supply on each chain is not constant but the aggregate supply across all chains is.
 */
contract FaucetfulERC20 is TokenRouter, ERC20Upgradeable {
    address public mainnetRouter;

    /**
     * @dev Emitted on `transferRemote` when a transfer message is dispatched.
     * @param destination The identifier of the destination chain.
     * @param recipient The address of the recipient on the destination chain.
     * @param amount The amount of tokens burnt on the origin chain.
     */
    event SentTransferRemote(
        uint32 indexed destination,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @dev Emitted on `_handle` when a transfer message is processed.
     * @param origin The identifier of the origin chain.
     * @param recipient The address of the recipient on the destination chain.
     * @param amount The amount of tokens minted on the destination chain.
     */
    event ReceivedTransferRemote(
        uint32 indexed origin,
        address indexed recipient,
        uint256 amount
    );

    modifier onlyMainnet() {
        require(
            mainnetRouter == address(0) || address(this) == mainnetRouter, "FaucetfulERC20: not mainnet token"
        );
        _;
    }

    modifier onlyTestnet() {
        require(
            mainnetRouter == address(0) || address(this) != mainnetRouter, "FaucetfulERC20: not testnet token"
        );
        _;
    }

    /**
     * @notice Initializes the Hyperlane router, ERC20 metadata.
     * @param _mailbox The address of the mailbox contract.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     * @param _interchainSecurityModule The address of the interchain security module contract.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     */
    function initialize(
        address _mailbox,
        address _interchainGasPaymaster,
        address _interchainSecurityModule,
        string memory _name,
        string memory _symbol
    ) external initializer {
        // transfers ownership to `msg.sender`
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster,
            _interchainSecurityModule
        );

        // Initialize ERC20 metadata
        __ERC20_init(_name, _symbol);
    }

    // called in `TokenRouter.transferRemote` before `Mailbox.dispatch`
    function _transferFromSender(uint256 _amount) internal override {
        _burn(msg.sender, _amount);
    }

    // called by `TokenRouter.handle`
    function _transferTo(address _recipient, uint256 _amount)
        internal
        override
    {
        _mint(_recipient, _amount);
    }

    /**
     * @notice Sets the mainnet router address.
     * @param _mainnetRouter The address of the mainnet router.
     */
    function setMainnetRouter(address _mainnetRouter) external onlyOwner {
        mainnetRouter = _mainnetRouter;
    }


    // check if chain is mainnet
    function deposit() public payable onlyMainnet {
        _mint(msg.sender, msg.value);
        emit Transfer(address(0), msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyMainnet {
        require(
            amount <= balanceOf(msg.sender),
            "FETH: Insufficient balance"
        );
        _burn(msg.sender, amount);

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "FETH: ETH transfer failed");

        emit Transfer(msg.sender, address(0), amount);
    }

    /// @dev Fallback, `msg.value` of ETH sent to this contract grants caller account a matching increase in FaucetfulERC20 token balance.
    /// Emits {Transfer} event to reflect FaucetfulERC20 token mint of `msg.value` from `address(0)` to caller account.
    receive() external payable {
        require(msg.value > 0, "FaucetfulERC20: Cannot deposit 0");
        deposit();
    }
}
