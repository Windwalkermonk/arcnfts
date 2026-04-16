import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Create } from './pages/Create';
import { Explore } from './pages/Explore';
import { Collection } from './pages/Collection';
import { Portfolio } from './pages/Portfolio';
import { useWallet } from './hooks/useWallet';

export default function App() {
  const { address, signer, isConnecting, connect, disconnect } = useWallet();

  return (
    <BrowserRouter>
      <Navbar
        walletAddress={address}
        isConnecting={isConnecting}
        onConnect={connect}
        onDisconnect={disconnect}
      />
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
