import { ethers } from 'ethers';

import { RouterConfig, chainConnectionConfigs } from '@hyperlane-xyz/sdk';

export type Erc20TokenConfig = {
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
  isMainnetRouter: boolean;
};

export const prodConfigs = {
  goerli: chainConnectionConfigs.goerli,
  // ethereum: chainConnectionConfigs.ethereum,
  mumbai: chainConnectionConfigs.mumbai,
};

export type FaucetfulERC20Config = RouterConfig & Erc20TokenConfig;
