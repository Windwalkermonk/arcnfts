import { Link, useLocation } from 'react-router-dom';
import type { CSSProperties } from 'react';

interface NavbarProps {
  walletAddress: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Navbar({ walletAddress, isConnecting, onConnect, onDisconnect }: NavbarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <span style={styles.logo}>◆</span>
        <span style={styles.brandText}>ArcNFTs</span>
      </Link>

      <div style={styles.links}>
        <Link to="/" style={{ ...styles.link, color: isActive('/') ? '#00ff88' : '#666' }}>Home</Link>
        <Link to="/create" style={{ ...styles.link, color: isActive('/create') ? '#00ff88' : '#666' }}>Create</Link>
        <Link to="/explore" style={{ ...styles.link, color: isActive('/explore') ? '#00ff88' : '#666' }}>Explore</Link>
        {walletAddress && (
          <Link to="/portfolio" style={{ ...styles.link, color: isActive('/portfolio') ? '#00ff88' : '#666' }}>Portfolio</Link>
        )}
      </div>

      <div style={styles.right}>
        {walletAddress ? (
          <button onClick={onDisconnect} style={styles.walletBtn}>
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </button>
        ) : (
          <button onClick={onConnect} style={styles.connectBtn} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, CSSProperties> = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(8,8,12,0.92)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1a1a1a',
    padding: '0 32px', height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
  },
  logo: {
    fontSize: 22, color: '#00ff88',
  },
  brandText: {
    fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
  },
  links: {
    display: 'flex', gap: 24,
  },
  link: {
    fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s',
  },
  right: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  connectBtn: {
    background: '#00ff88', color: '#000', fontSize: 13, fontWeight: 600,
    padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
  },
  walletBtn: {
    background: '#111', color: '#00ff88', fontSize: 13, fontWeight: 500,
    padding: '8px 16px', borderRadius: 6, border: '1px solid #222', cursor: 'pointer',
    fontFamily: 'monospace',
  },
};
