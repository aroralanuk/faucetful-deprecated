import {
  ChainMap,
  ChainName,
  HyperlaneCore,
  HyperlaneRouterDeployer,
  MultiProvider,
} from '@hyperlane-xyz/sdk';

import { FaucetfulERC20Config } from './config';
import {
  FaucetfulERC20Contracts,
  FaucetfulERC20Factories,
  faucetfulERC20Factories,
} from './contracts';

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
