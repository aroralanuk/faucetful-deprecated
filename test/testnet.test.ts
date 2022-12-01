import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import '@nomiclabs/hardhat-waffle';
import { expect } from 'chai';
import * as dotenv from 'dotenv';
import { Contract, Wallet } from 'ethers';
import fs from 'fs';
import { ethers } from 'hardhat';

import {
  ChainMap,
  ChainName,
  ChainNameToDomainId,
  TestChainNames,
  TestCoreApp,
  TestCoreDeployer,
  getChainToOwnerMap,
  getTestMultiProvider,
  objMap,
  serializeContracts,
  testChainConnectionConfigs,
} from '@hyperlane-xyz/sdk';

import { Erc20TokenConfig, FaucetfulERC20Config } from '../src/config';
import { FaucetfulERC20Contracts } from '../src/contracts';
import { FaucetfulERC20Deployer, deployTestnet } from '../src/deploy';
import { FaucetfulERC20 } from '../src/types';

dotenv.config();

const localChain = 'test1';
const remoteChain = 'test2';
const localDomain = ChainNameToDomainId[localChain];
const remoteDomain = ChainNameToDomainId[remoteChain];
const totalSupply = 0;
const amount = 12;
const depositAmount = 37;
const deployerBalance = totalSupply + depositAmount;
const testInterchainGasPayment = 123456789;

function checkDeploy() {
  let deployInfo;
  try {
    deployInfo = JSON.parse(
      fs.readFileSync(`./deployinfo/deploy.json`).toString(),
    );
  } catch (e) {
    throw new Error(`Not deployed yet`);
  }
  return deployInfo;
}

describe('FaucetfulERC20', async () => {
  let owner: SignerWithAddress;
  let mainnetSigner: Wallet;
  let testnetSigner: Wallet;
  let recipient: SignerWithAddress;
  let core: TestCoreApp;
  let deployer: FaucetfulERC20Deployer<TestChainNames>;
  let contracts: Record<TestChainNames, FaucetfulERC20Contracts>;
  let local: Contract;
  let remote: Contract;

  before(async () => {
    // owner = new ethers.Wallet(process.env.PRIVATE_KEY).connect(
    //   new ethers.providers.JsonRpcProvider(process.env.GOERLI_RPC_URL),
    // );
    [owner, recipient] = await ethers.getSigners();

    const routerInfo = checkDeploy();
    console.log(
      'contracts addresses are',
      routerInfo.goerli,
      'on goerli and',
      routerInfo.mumbai,
      'on mumbai',
    );

    const erc20factory = await ethers.getContractFactory('FaucetfulERC20');

    const backupKey =
      '0x0123456789012345678901234567890123456789012345678901234567890123';
    mainnetSigner = new Wallet(process.env.PRIVATE_KEY || backupKey).connect(
      new ethers.providers.JsonRpcProvider(process.env.MUMBAI_RPC_URL),
    );
    testnetSigner = new Wallet(process.env.PRIVATE_KEY || backupKey).connect(
      new ethers.providers.JsonRpcProvider(process.env.GOERLI_RPC_URL),
    );

    local = new ethers.Contract(
      routerInfo.goerli,
      erc20factory.interface,
      testnetSigner,
    );
    remote = new ethers.Contract(
      routerInfo.mumbai,
      erc20factory.interface,
      mainnetSigner,
    );

    // let contracts = await deployTestnet();
    // local = contracts[localChain].router;
    // remote = contracts[remoteChain].router;

    // TODO: call individual functions
    // const chains = Object.keys(configWithTokenInfo) as Array<ChainName>;
    // chains.forEach((chain) => {
    //     await deployer.deployContracts(
    //         chain,
    //         {...configWithTokenInfo, isMainnetRouter: chain === 'ethereum'}
    //     );
    // });

    // contracts = await deployer.deploy();
  });

  it('should not be initializable again', async () => {
    // await expect(
    //   local.initialize(
    //     ethers.constants.AddressZero,
    //     ethers.constants.AddressZero,
    //     0,
    //     '',
    //     '',
    //   ),
    // ).to.be.revertedWith('Initializable: contract is already initialized');
    // local.initialize(
    //   ethers.constants.AddressZero,
    //   ethers.constants.AddressZero,
    //   0,
    //   '',
    //   '',
    // );
    const decimals = await local.decimals();
    console.log('decimals', decimals);
  });

  // it('should mint total supply to deployer', async () => {
  //   await expectBalance(local, recipient, 0);
  //   await expectBalance(local, owner, totalSupply);
  //   await expectBalance(remote, recipient, 0);
  //   await expectBalance(remote, owner, totalSupply);
  // });

  it('should allow for eth deposits', async () => {
    await remote.deposit({ value: depositAmount, gasLimit: 600000 });
    // console.log(
    //   'balance of owner',
    //   await remote.balanceOf(mainnetSigner.address),
    // );
    // await expectBalance(local, owner, deployerBalance);
  });

  // it("shouldn't allow for eth deposits", async () => {
  //   await expect(remote.deposit({ value: depositAmount })).to.be.revertedWith(
  //     'FaucetfulERC20: not mainnet router',
  //   );
  //   // await remote.deposit({ value: depositAmount });
  //   await expectBalance(remote, owner, totalSupply);
  // });

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
  token: Contract,
  signer: SignerWithAddress,
  balance: number,
) => expect(await token.balanceOf(signer.address)).to.eq(balance);
