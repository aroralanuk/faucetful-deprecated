import { ethers } from 'ethers';

import { RouterConfig } from '@hyperlane-xyz/sdk';

export type Erc20TokenConfig = {
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
  isMainnetRouter: boolean;
};

export type FaucetfulERC20Config = RouterConfig & Erc20TokenConfig;
