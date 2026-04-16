import { Link } from 'react-router-dom';
import { useState, useEffect, type CSSProperties } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { ARC_TESTNET } from '../config/network';
import { NFT_FACTORY_ABI, NFT_COLLECTION_ABI } from '../config/abis';

const FACTORY_STORAGE_KEY = 'arcnfts_factory_address';

interface CollectionInfo {
  address: string;
  name: string;
  symbol: string;
  maxSupply: string;
  totalMinted: string;
}

export function Home() {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const factoryAddr = localStorage.getItem(FACTORY_STORAGE_KEY);
      if (!factoryAddr) { setLoading(false); return; }
      try {
        const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
        const factory = new Contract(factoryAddr, NFT_FACTORY_ABI, provider);
        const addrs: string[] = await factory.getAllCollections();

        const items: CollectionInfo[] = await Promise.all(
          addrs.slice(-6).map(async (addr) => {
            try {
              const nft = new Contract(addr, NFT_COLLECTION_ABI, provider);
              const [name, symbol, maxSupply, totalMinted] = await Promise.all([
                nft.name(), nft.symbol(), nft.maxSupply(), nft.totalMinted(),
              ]);
              return { address: addr, name, symbol, maxSupply: maxSupply.toString(), totalMinted: totalMinted.toString() };
            } catch {
              return { address: addr, name: '?', symbol: '?', maxSupply: '0', totalMinted: '0' };
            }
          }),
        );
        setCollections(items.reverse());
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const recent = collections.slice(0, 3);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.tag}>NFT LAUNCHPAD · ARC NETWORK</p>
        <h1 style={styles.heading}>Launch your<br />NFT collection.</h1>
        <p style={styles.subtitle}>
          Create and deploy NFT collections with encrypted reveal on Arc Network.
          No code required. One transaction.
        </p>
        <div style={styles.ctas}>
          <Link to="/create" style={styles.primaryBtn}>Create Collection</Link>
          <Link to="/explore" style={styles.secondaryBtn}>Explore</Link>
        </div>
      </section>

      <section style={styles.features}>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🎨</div>
          <h3 style={styles.featureTitle}>No-Code Deploy</h3>
          <p style={styles.featureText}>Fill in the form, click deploy. Your NFT collection is live on Arc in seconds.</p>
        </div>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🔐</div>
          <h3 style={styles.featureTitle}>Encrypted Reveal</h3>
          <p style={styles.featureText}>Hide metadata until you're ready. Commit-reveal pattern ensures fairness — no one sees the art early.</p>
        </div>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>⚡</div>
          <h3 style={styles.featureTitle}>Arc Native</h3>
          <p style={styles.featureText}>Sub-second finality. USDC-native ecosystem. Built for Circle's L1 blockchain.</p>
        </div>
      </section>

      <section style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{loading ? '—' : collections.length}</span>
          <span style={styles.statLabel}>Collections</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.stat}>
          <span style={styles.statValue}>ERC-721</span>
          <span style={styles.statLabel}>Standard</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.stat}>
          <span style={styles.statValue}>&lt;1s</span>
          <span style={styles.statLabel}>Finality</span>
        </div>
      </section>

      {recent.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Collections</h2>
            <Link to="/explore" style={styles.viewAll}>View all →</Link>
          </div>
          <div style={styles.grid}>
            {recent.map((c) => {
              const img = localStorage.getItem(`divarc_img_${c.address}`);
              return (
                <Link to={`/collection/${c.address}`} key={c.address} style={styles.card}>
                  <div style={styles.cardImage}>
                    {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: '#333' }}>◆</span>}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.name}</h4>
                      <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 600 }}>{c.symbol}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{c.totalMinted}/{c.maxSupply} minted</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px' },
  hero: { paddingTop: 80, paddingBottom: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  tag: { fontSize: 11, fontWeight: 500, color: '#00ff88', marginBottom: 24, letterSpacing: '0.15em' },
  heading: { fontSize: 72, fontWeight: 700, lineHeight: 1.05, color: '#fff', marginBottom: 24, letterSpacing: '-0.03em' },
  subtitle: { fontSize: 16, color: '#555', lineHeight: 1.7, marginBottom: 40, maxWidth: 440 },
  ctas: { display: 'flex', gap: 12 },
  primaryBtn: { background: '#00ff88', color: '#000', fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 8, textDecoration: 'none' },
  secondaryBtn: { background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 500, padding: '12px 28px', borderRadius: 8, border: '1px solid #222', textDecoration: 'none' },

  features: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 80 },
  featureCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: 28 },
  featureIcon: { fontSize: 28, marginBottom: 14 },
  featureTitle: { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 },
  featureText: { fontSize: 13, color: '#555', lineHeight: 1.6 },

  statsRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 80, padding: '0 40px' },
  stat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 40px' },
  statValue: { fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' },
  statLabel: { fontSize: 11, fontWeight: 500, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' },
  divider: { width: 1, height: 48, background: '#222', flexShrink: 0 },

  section: { marginBottom: 60 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#fff' },
  viewAll: { fontSize: 13, color: '#555', textDecoration: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden', textDecoration: 'none', transition: 'border-color 0.2s' },
  cardImage: { width: '100%', aspectRatio: '1.4', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
