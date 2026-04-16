import { Link } from 'react-router-dom';
import { useState, useEffect, type CSSProperties } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { ARC_TESTNET } from '../config/network';
import { NFT_FACTORY_ABI } from '../config/abis';

interface CollectionInfo {
  address: string;
  name: string;
  symbol: string;
  maxSupply: string;
  mintPrice: string;
  hasEncryptedReveal: boolean;
}

export function Home() {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!ARC_TESTNET.contracts.nftFactory) { setLoading(false); return; }
      try {
        const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
        const factory = new Contract(ARC_TESTNET.contracts.nftFactory, NFT_FACTORY_ABI, provider);
        const latest = await provider.getBlockNumber();
        const from = Math.max(0, latest - 9000);
        const events = await factory.queryFilter(factory.filters.CollectionCreated(), from, latest);

        const items: CollectionInfo[] = events.map((e) => {
          const parsed = factory.interface.parseLog({ topics: [...e.topics], data: e.data })!;
          return {
            address: parsed.args.collectionAddress,
            name: parsed.args.name,
            symbol: parsed.args.symbol,
            maxSupply: parsed.args.maxSupply.toString(),
            mintPrice: parsed.args.mintPrice.toString(),
            hasEncryptedReveal: parsed.args.hasEncryptedReveal,
          };
        });
        setCollections(items);
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const recent = collections.slice(-3).reverse();

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

      {collections.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Collections</h2>
            <Link to="/explore" style={styles.viewAll}>View all →</Link>
          </div>
          <div style={styles.grid}>
            {recent.map((c) => (
              <Link to={`/collection/${c.address}`} key={c.address} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={styles.cardSymbol}>{c.symbol}</span>
                  {c.hasEncryptedReveal && <span style={styles.encBadge}>🔐 Encrypted</span>}
                </div>
                <h4 style={styles.cardName}>{c.name}</h4>
                <p style={styles.cardMeta}>{c.maxSupply} items</p>
              </Link>
            ))}
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
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: 22, textDecoration: 'none', transition: 'border-color 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardSymbol: { fontSize: 12, fontWeight: 600, color: '#00ff88', background: 'rgba(0,255,136,0.08)', padding: '3px 8px', borderRadius: 4 },
  encBadge: { fontSize: 11, color: '#a78bfa' },
  cardName: { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#555' },
};
