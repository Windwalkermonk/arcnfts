import { useState, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { ARC_TESTNET } from '../config/network';

interface WalletState {
  address: string | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    signer: null,
    isConnecting: false,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to connect your wallet.');
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('wallet_requestPermissions', [{ eth_accounts: {} }]);
      await provider.send('eth_requestAccounts', []);

      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: ARC_TESTNET.chainIdHex },
        ]);
      } catch (switchError: unknown) {
        const err = switchError as { code: number };
        if (err.code === 4902) {
          await provider.send('wallet_addEthereumChain', [
            {
              chainId: ARC_TESTNET.chainIdHex,
              chainName: ARC_TESTNET.name,
              rpcUrls: [ARC_TESTNET.rpcUrl],
              nativeCurrency: ARC_TESTNET.nativeCurrency,
            },
          ]);
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet({ address, signer, isConnecting: false });
    } catch {
      setWallet({ address: null, signer: null, isConnecting: false });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, signer: null, isConnecting: false });
  }, []);

  return { ...wallet, connect, disconnect };
}
