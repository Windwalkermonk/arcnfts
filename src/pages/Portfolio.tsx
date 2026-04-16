import { useState, useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Contract, JsonRpcProvider } from 'ethers';
import { ARC_TESTNET } from '../config/network';
import { NFT_FACTORY_ABI, NFT_COLLECTION_ABI } from '../config/abis';

const FACTORY_STORAGE_KEY = 'arcnfts_factory_address';

interface MyCollection {
  address: string;
  name: string;
  symbol: string;
  maxSupply: string;
  totalMinted: string;
}

interface PortfolioProps {
  walletAddress: string | null;
}

export function Portfolio({ walletAddress }: PortfolioProps) {
  const [collections, setCollections] = useState<MyCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const factoryAddr = localStorage.getItem(FACTORY_STORAGE_KEY);
      if (!walletAddress || !factoryAddr) { setLoading(false); return; }
      try {
        const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
        const factory = new Contract(factoryAddr, NFT_FACTORY_ABI, provider);
        const addrs: string[] = await factory.getAllCollections();

        const items: MyCollection[] = [];
        for (const addr of addrs) {
          try {
            const nft = new Contract(addr, NFT_COLLECTION_ABI, provider);
            const owner = await nft.owner();
            if (owner.toLowerCase() === walletAddress.toLowerCase()) {
              const [name, symbol, maxSupply, totalMinted] = await Promise.all([
                nft.name(), nft.symbol(), nft.maxSupply(), nft.totalMinted(),
              ]);
              items.push({ address: addr, name, symbol, maxSupply: maxSupply.toString(), totalMinted: totalMinted.toString() });
            }
          } catch { /* skip */ }
        }
        setCollections(items.reverse());
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div style={styles.page}>
        <div style={styles.empty}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Connect your wallet</p>
          <p style={{ fontSize: 13, color: '#555' }}>Connect your wallet to see your NFT collections.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.tag}>PORTFOLIO</p>
        <h1 style={styles.title}>My Collections</h1>
        <p style={styles.subtitle}>Collections you've created on Arc Network.</p>
      </div>

      {loading ? (
        <div style={styles.empty}><p style={{ color: '#555' }}>Loading...</p></div>
      ) : collections.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No collections yet</p>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>You haven't created any NFT collections.</p>
          <Link to="/create" style={styles.createBtn}>Create Collection</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {collections.map((c) => {
            const img = localStorage.getItem(`divarc_img_${c.address}`);
            return (
              <Link to={`/collection/${c.address}`} key={c.address} style={styles.card}>
                <div style={styles.cardImage}>
                  {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: '#333' }}>◆</span>}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{c.name}</h4>
                    <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 600 }}>{c.symbol}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#555' }}>{c.totalMinted}/{c.maxSupply} minted</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px' },
  header: { marginBottom: 32 },
  tag: { fontSize: 11, fontWeight: 500, color: '#00ff88', marginBottom: 12, letterSpacing: '0.15em' },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' },
  subtitle: { fontSize: 15, color: '#555' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden', textDecoration: 'none' },
  cardImage: { width: '100%', aspectRatio: '1', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '60px 24px', textAlign: 'center' },
  createBtn: { background: '#00ff88', color: '#000', fontSize: 13, fontWeight: 600, padding: '10px 22px', borderRadius: 6, textDecoration: 'none', display: 'inline-block' },
};
