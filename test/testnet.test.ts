import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import '@nomiclabs/hardhat-waffle';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { ethers } from 'hardhat';

import {
  ChainMap,
  ChainNameToDomainId,
  TestChainNames,
  TestCoreApp,
  TestCoreDeployer,
  getChainToOwnerMap,
  getTestMultiProvider,
  objMap,
  testChainConnectionConfigs,
} from '@hyperlane-xyz/sdk';

import { Erc20TokenConfig, FaucetfulERC20Config } from '../src/config';
import { FaucetfulERC20Contracts } from '../src/contracts';
import { FaucetfulERC20Deployer } from '../src/deploy';
import { FaucetfulERC20 } from '../src/types';

const localChain = 'mumbai';
const remoteChain = 'goerli';
const localDomain = ChainNameToDomainId[localChain];
const remoteDomain = ChainNameToDomainId[remoteChain];
const totalSupply = 0;
const amount = 12;
const depositAmount = 37;
const deployerBalance = totalSupply + depositAmount;
const testInterchainGasPayment = 123456789;

const tokenConfig: Erc20TokenConfig = {
  name: 'FaucetfulERC20',
  symbol: 'FETH',
  totalSupply,
  isMainnetRouter: true,
};

describe('FaucetfulERC20', async () => {
  let owner: Wallet;
  let recipient: SignerWithAddress;
  let core: TestCoreApp;
  let deployer: FaucetfulERC20Deployer<TestChainNames>;
  let contracts: Record<TestChainNames, FaucetfulERC20Contracts>;
  let local: FaucetfulERC20;
  let remote: FaucetfulERC20;

  before(async () => {
    owner = new ethers.Wallet(process.env.PRIVATE_KEY).connect(
      new ethers.providers.JsonRpcProvider(process.env.GOERLI_RPC_URL),
    );
    [recipient] = await ethers.getSigners();
    console.log(owner);
    const multiProvider = getTestMultiProvider(owner);

    const coreDeployer = new TestCoreDeployer(multiProvider);
    const coreContractsMaps = await coreDeployer.deploy();
    core = new TestCoreApp(coreContractsMaps, multiProvider);
    const config = core.extendWithConnectionClientConfig(
      getChainToOwnerMap(testChainConnectionConfigs, owner.address),
    );
    const configWithTokenInfo: ChainMap<TestChainNames, FaucetfulERC20Config> =
      objMap(config, (key) => ({
        ...config[key],
        ...tokenConfig,
        isMainnetRouter: key === 'test1',
      }));
    deployer = new FaucetfulERC20Deployer(
      multiProvider,
      configWithTokenInfo,
      core,
    );
    contracts = await deployer.deploy();
    local = contracts[localChain].router;
    remote = contracts[remoteChain].router;
  });

  it('should not be initializable again', async () => {
    await expect(
      local.initialize(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        0,
        '',
        '',
        true,
      ),
    ).to.be.revertedWith('Initializable: contract is already initialized');
  });

  it('should mint total supply to deployer', async () => {
    await expectBalance(local, recipient, 0);
    await expectBalance(local, owner, totalSupply);
    await expectBalance(remote, recipient, 0);
    await expectBalance(remote, owner, totalSupply);
  });

  it('should allow for eth deposits', async () => {
    await local.deposit({ value: depositAmount });
    await expectBalance(local, owner, deployerBalance);
  });

  it("shouldn't allow for eth deposits", async () => {
    await expect(remote.deposit({ value: depositAmount })).to.be.revertedWith(
      'FaucetfulERC20: not mainnet router',
    );
    // await remote.deposit({ value: depositAmount });
    await expectBalance(remote, owner, totalSupply);
  });

  // it('should allow for local transfers', async () => {
  //   await local.transfer(recipient.address, amount);
  //   await expectBalance(local, recipient, amount);
  //   await expectBalance(local, owner, deployerBalance - amount);
  //   await expectBalance(remote, recipient, 0);
  //   await expectBalance(remote, owner, totalSupply);
  // });

  // it('should allow for remote transfers', async () => {
  //   await local.transferRemote(remoteDomain, recipient.address, amount);

  //   await expectBalance(local, recipient, amount);
  //   await expectBalance(local, owner, deployerBalance - amount * 2);
  //   await expectBalance(remote, recipient, 0);
  //   await expectBalance(remote, owner, totalSupply);

  //   await core.processMessages();

  //   await expectBalance(local, recipient, amount);
  //   await expectBalance(local, owner, deployerBalance - amount * 2);
  //   await expectBalance(remote, recipient, amount);
  //   await expectBalance(remote, owner, totalSupply);
  // });

  // it('allows interchain gas payment for remote transfers', async () => {
  //   const outbox = core.getMailboxPair(localChain, remoteChain).originOutbox;
  //   const interchainGasPaymaster =
  //     core.contractsMap[localChain].interchainGasPaymaster.contract;
  //   const leafIndex = await outbox.count();
  //   await expect(
  //     local.transferRemote(remoteDomain, recipient.address, amount, {
  //       value: testInterchainGasPayment,
  //     }),
  //   )
  //     .to.emit(interchainGasPaymaster, 'GasPayment')
  //     .withArgs(outbox.address, leafIndex, testInterchainGasPayment);
  // });

  // it('should emit TransferRemote events', async () => {
  //   expect(await local.transferRemote(remoteDomain, recipient.address, amount))
  //     .to.emit(local, 'SentTransferRemote')
  //     .withArgs(remoteDomain, recipient.address, amount);
  //   expect(await core.processMessages())
  //     .to.emit(local, 'ReceivedTransferRemote')
  //     .withArgs(localDomain, recipient.address, amount);
  // });
});

const expectBalance = async (
  token: FaucetfulERC20,
  signer: SignerWithAddress,
  balance: number,
) => expect(await token.balanceOf(signer.address)).to.eq(balance);
