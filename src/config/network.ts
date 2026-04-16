export const ARC_TESTNET = {
  chainId: 5042002,
  chainIdHex: '0x4CEF52',
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.quicknode.testnet.arc.network',
  blockExplorer: 'https://testnet.arcscan.app',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  contracts: {
    nftFactory: '', // filled after deploy
  },
} as const;
