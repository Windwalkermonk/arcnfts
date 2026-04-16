export const ARC_TESTNET = {
  chainId: 5042002,
  chainIdHex: '0x4CF1D2',
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.quicknode.testnet.arc.network',
  blockExplorer: 'https://testnet.arc.network',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  contracts: {
    nftFactory: '', // filled after deploy
  },
} as const;
