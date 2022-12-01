import { ethers } from 'ethers';

import { RouterConfig, chainConnectionConfigs } from '@hyperlane-xyz/sdk';

export type Erc20TokenConfig = {
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
};

export const prodConfigs = {
  goerli: {
    ...chainConnectionConfigs.goerli,
    confirmations: 1,
  },
  // ethereum: chainConnectionConfigs.ethereum,
  mumbai: {
    ...chainConnectionConfigs.mumbai,
    confirmations: 1,
    overrides: {
      maxFeePerGas: 70 * 10 ** 9, // 1000 gwei
      maxPriorityFeePerGas: 40 * 10 ** 9, // 40 gwei
      gasLimit: 60000,
    },
  },
};

export type FaucetfulERC20Config = RouterConfig & Erc20TokenConfig;
