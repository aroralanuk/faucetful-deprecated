import * as dotenv from 'dotenv';
import { Wallet } from 'ethers';

import {
  ChainMap,
  ChainName,
  HyperlaneCore,
  HyperlaneRouterDeployer,
  MultiProvider,
  getChainToOwnerMap,
  objMap,
  serializeContracts,
} from '@hyperlane-xyz/sdk';

import { prodConfigs } from './config';
import { Erc20TokenConfig, FaucetfulERC20Config } from './config';
import {
  FaucetfulERC20Contracts,
  FaucetfulERC20Factories,
  faucetfulERC20Factories,
} from './contracts';

dotenv.config();

export class FaucetfulERC20Deployer<
  Chain extends ChainName,
> extends HyperlaneRouterDeployer<
  Chain,
  FaucetfulERC20Config,
  FaucetfulERC20Contracts,
  FaucetfulERC20Factories
> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, FaucetfulERC20Config>,
    protected core: HyperlaneCore<Chain>,
  ) {
    super(multiProvider, configMap, faucetfulERC20Factories);
  }

  async deployContracts(chain: Chain, config: FaucetfulERC20Config) {
    const router = await this.deployContract(chain, 'router', []);
    await router.initialize(
      config.connectionManager,
      config.interchainGasPaymaster,
      config.totalSupply,
      config.name,
      config.symbol,
      config.isMainnetRouter,
    );
    return {
      router,
    };
  }
}

export async function deployTestnet(tokenConfig: Erc20TokenConfig) {
  console.info('Getting signer');
  const backupKey =
    '0x0123456789012345678901234567890123456789012345678901234567890123';
  const signer = new Wallet(process.env.PRIVATE_KEY || backupKey);

  console.info('Preparing utilities');
  const chainProviders = objMap(prodConfigs, (_, config) => ({
    ...config,
    signer: signer.connect(config.provider),
  }));
  const multiProvider = new MultiProvider(chainProviders);

  const core = HyperlaneCore.fromEnvironment('testnet2', multiProvider);
  const config = core.extendWithConnectionClientConfig(
    getChainToOwnerMap(prodConfigs, signer.address),
  );
  const configWithTokenInfo: ChainMap<ChainName, FaucetfulERC20Config> = objMap(
    config,
    (key) => ({
      ...config[key],
      ...tokenConfig,
      isMainnetRouter: key === 'mumbai',
    }),
  );

  const deployer = new FaucetfulERC20Deployer(
    multiProvider,
    configWithTokenInfo,
    core,
  );
  const chainToContracts = await deployer.deploy();
  return chainToContracts;
}
