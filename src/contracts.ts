import { RouterContracts, RouterFactories } from '@hyperlane-xyz/sdk';

import { FaucetfulERC20, FaucetfulERC20__factory } from './types';

export type FaucetfulERC20Factories = RouterFactories<FaucetfulERC20>;

export const faucetfulERC20Factories: FaucetfulERC20Factories = {
  router: new FaucetfulERC20__factory(),
};

export type FaucetfulERC20Contracts = RouterContracts<FaucetfulERC20>;
