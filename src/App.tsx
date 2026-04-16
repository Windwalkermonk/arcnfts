import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Create } from './pages/Create';
import { Explore } from './pages/Explore';
import { Collection } from './pages/Collection';
import { Portfolio } from './pages/Portfolio';
import { useWallet } from './hooks/useWallet';

export default function App() {
  const { address, signer, isConnecting, wrongNetwork, connect, disconnect } = useWallet();

  return (
    <BrowserRouter>
      <Navbar
        walletAddress={address}
        isConnecting={isConnecting}
        wrongNetwork={wrongNetwork}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      {wrongNetwork && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99,
          background: '#ef4444', color: '#fff', textAlign: 'center',
          padding: '10px 16px', fontSize: 13, fontWeight: 600,
        }}>
          Wrong network! Please switch to Arc Testnet (Chain ID: 5042002) in your wallet.
          <button onClick={connect} style={{
            marginLeft: 12, background: '#fff', color: '#ef4444',
            border: 'none', borderRadius: 4, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            Switch Network
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create walletAddress={address} signer={signer} />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/collection/:address" element={<Collection walletAddress={address} signer={signer} />} />
        <Route path="/portfolio" element={<Portfolio walletAddress={address} />} />
      </Routes>
    </BrowserRouter>
  );
}
