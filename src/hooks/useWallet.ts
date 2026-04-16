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
      alert('Please install a Web3 wallet (MetaMask, Rabby, etc.)');
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      // Always try to add Arc Testnet first, then switch
      try {
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: ARC_TESTNET.chainIdHex,
            chainName: ARC_TESTNET.name,
            rpcUrls: [ARC_TESTNET.rpcUrl],
            blockExplorerUrls: [ARC_TESTNET.blockExplorer],
            nativeCurrency: ARC_TESTNET.nativeCurrency,
          },
        ]);
      } catch {
        // Chain might already exist, try switch
      }

      await provider.send('wallet_switchEthereumChain', [
        { chainId: ARC_TESTNET.chainIdHex },
      ]);

      // Re-create provider after chain switch to ensure correct network
      const freshProvider = new BrowserProvider(window.ethereum);
      const network = await freshProvider.getNetwork();

      if (Number(network.chainId) !== ARC_TESTNET.chainId) {
        alert(`Please switch to Arc Testnet (Chain ID: ${ARC_TESTNET.chainId}) in your wallet.`);
        setWallet({ address: null, signer: null, isConnecting: false });
        return;
      }

      const signer = await freshProvider.getSigner();
      const address = await signer.getAddress();
      setWallet({ address, signer, isConnecting: false });
    } catch (err) {
      console.error('Wallet connect failed:', err);
      alert('Failed to connect. Please switch to Arc Testnet manually in your wallet.');
      setWallet({ address: null, signer: null, isConnecting: false });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, signer: null, isConnecting: false });
  }, []);

  return { ...wallet, connect, disconnect };
}
