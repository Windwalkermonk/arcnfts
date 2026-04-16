import { useState, useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Contract, JsonRpcProvider, formatEther } from 'ethers';
import { ARC_TESTNET } from '../config/network';
import { NFT_FACTORY_ABI, NFT_COLLECTION_ABI } from '../config/abis';

const FACTORY_STORAGE_KEY = 'arcnfts_factory_address';

interface CollectionDetail {
  address: string;
  name: string;
  symbol: string;
  maxSupply: string;
  totalMinted: string;
  mintPrice: string;
  revealed: boolean;
  hasCommit: boolean;
}

export function Explore() {
  const [collections, setCollections] = useState<CollectionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const factoryAddr = localStorage.getItem(FACTORY_STORAGE_KEY);
      if (!factoryAddr) { setLoading(false); return; }
      try {
        const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
        const factory = new Contract(factoryAddr, NFT_FACTORY_ABI, provider);
        const addrs: string[] = await factory.getAllCollections();

        const items: CollectionDetail[] = await Promise.all(
          addrs.map(async (addr) => {
            try {
              const nft = new Contract(addr, NFT_COLLECTION_ABI, provider);
              const [name, symbol, maxSupply, totalMinted, mintPrice, revealed, commitHash] = await Promise.all([
                nft.name(), nft.symbol(), nft.maxSupply(), nft.totalMinted(),
                nft.mintPrice(), nft.revealed(), nft.metadataCommitHash(),
              ]);
              return {
                address: addr, name, symbol,
                maxSupply: maxSupply.toString(), totalMinted: totalMinted.toString(),
                mintPrice: mintPrice.toString(), revealed,
                hasCommit: commitHash !== '0x' + '0'.repeat(64),
              };
            } catch {
              return { address: addr, name: '?', symbol: '?', maxSupply: '0', totalMinted: '0', mintPrice: '0', revealed: false, hasCommit: false };
            }
          }),
        );
        setCollections(items.reverse());
      } catch (err) {
        console.error('Failed to load collections:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.tag}>EXPLORE</p>
        <h1 style={styles.title}>All Collections</h1>
        <p style={styles.subtitle}>Browse NFT collections deployed on Arc Network.</p>
      </div>

      {loading ? (
        <div style={styles.empty}><p style={{ color: '#555' }}>Loading...</p></div>
      ) : collections.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No collections yet</p>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>Be the first to launch an NFT collection on Arc.</p>
          <Link to="/create" style={styles.createBtn}>Create Collection</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {collections.map((c) => {
            const img = localStorage.getItem(`divarc_img_${c.address}`);
            const priceFmt = c.mintPrice === '0' ? 'Free' : `${formatEther(c.mintPrice)} ETH`;
            const pct = Number(c.maxSupply) > 0 ? Math.round((Number(c.totalMinted) / Number(c.maxSupply)) * 100) : 0;

            return (
              <Link to={`/collection/${c.address}`} key={c.address} style={styles.card}>
                <div style={styles.cardImage}>
                  {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32, color: '#333' }}>◆</span>}
                  {c.hasCommit && (
                    <div style={styles.encLabel}>{c.revealed ? '✅ Revealed' : '🔐 Hidden'}</div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{c.name}</h4>
                    <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 600 }}>{c.symbol}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: '#555' }}>{c.totalMinted}/{c.maxSupply} minted</span>
                    <span style={{ fontSize: 12, color: '#555' }}>{priceFmt}</span>
                  </div>
                  <div style={styles.mintBar}>
                    <div style={{ ...styles.mintFill, width: `${pct}%` }} />
                  </div>
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
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden', textDecoration: 'none', transition: 'border-color 0.2s, transform 0.2s' },
  cardImage: { width: '100%', aspectRatio: '1', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  encLabel: { position: 'absolute', top: 10, right: 10, fontSize: 11, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4, color: '#a78bfa' },
  cardBody: { padding: 16 },
  mintBar: { height: 3, background: '#1a1a1a', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  mintFill: { height: '100%', background: '#00ff88', borderRadius: 2, transition: 'width 0.3s' },

  empty: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '60px 24px', textAlign: 'center' },
  createBtn: { background: '#00ff88', color: '#000', fontSize: 13, fontWeight: 600, padding: '10px 22px', borderRadius: 6, textDecoration: 'none', display: 'inline-block' },
};
