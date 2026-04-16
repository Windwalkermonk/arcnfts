import { useState, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { ARC_TESTNET } from '../config/network';

interface WalletState {
  address: string | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  wrongNetwork: boolean;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    signer: null,
    isConnecting: false,
    wrongNetwork: false,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install a Web3 wallet (MetaMask, Rabby, etc.)');
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, wrongNetwork: false }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      // Try to add Arc Testnet
      try {
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: ARC_TESTNET.chainIdHex,
            chainName: ARC_TESTNET.name,
            rpcUrls: [ARC_TESTNET.rpcUrl],
            blockExplorerUrls: ['https://testnet.arcscan.app/'],
            nativeCurrency: ARC_TESTNET.nativeCurrency,
          },
        ]);
      } catch {
        // May already exist
      }

      // Try to switch
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: ARC_TESTNET.chainIdHex },
        ]);
      } catch {
        // Switch may fail
      }

      // Wait a moment for chain switch to propagate
      await new Promise(r => setTimeout(r, 500));

      // Re-create provider and verify
      const freshProvider = new BrowserProvider(window.ethereum);
      const network = await freshProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== ARC_TESTNET.chainId) {
        setWallet({ address: null, signer: null, isConnecting: false, wrongNetwork: true });
        return;
      }

      const signer = await freshProvider.getSigner();
      const address = await signer.getAddress();
      setWallet({ address, signer, isConnecting: false, wrongNetwork: false });
    } catch (err) {
      console.error('Wallet connect failed:', err);
      setWallet({ address: null, signer: null, isConnecting: false, wrongNetwork: false });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, signer: null, isConnecting: false, wrongNetwork: false });
  }, []);

  return { ...wallet, connect, disconnect };
}
