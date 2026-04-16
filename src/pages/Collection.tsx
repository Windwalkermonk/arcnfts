import { useState, useEffect, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Contract, JsonRpcProvider, formatEther, parseEther } from 'ethers';
import type { JsonRpcSigner } from 'ethers';
import { ARC_TESTNET } from '../config/network';
import { NFT_COLLECTION_ABI } from '../config/abis';

interface CollectionProps {
  walletAddress: string | null;
  signer: JsonRpcSigner | null;
}

interface Info {
  name: string;
  symbol: string;
  maxSupply: bigint;
  totalMinted: bigint;
  mintPrice: bigint;
  description: string;
  revealed: boolean;
  hasCommit: boolean;
  owner: string;
}

export function Collection({ walletAddress, signer }: CollectionProps) {
  const { address } = useParams<{ address: string }>();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [mintedId, setMintedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!address) return;
      try {
        const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
        const nft = new Contract(address, NFT_COLLECTION_ABI, provider);
        const [name, symbol, maxSupply, totalMinted, mintPrice, description, revealed, commitHash, owner] = await Promise.all([
          nft.name(), nft.symbol(), nft.maxSupply(), nft.totalMinted(),
          nft.mintPrice(), nft.collectionDescription(), nft.revealed(),
          nft.metadataCommitHash(), nft.owner(),
        ]);
        setInfo({
          name, symbol, maxSupply, totalMinted, mintPrice, description, revealed,
          hasCommit: commitHash !== '0x' + '0'.repeat(64),
          owner,
        });
      } catch (err) {
        console.error('Failed to load collection:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const handleMint = async () => {
    if (!signer || !address || !info) return;
    setIsMinting(true);
    try {
      const nft = new Contract(address, NFT_COLLECTION_ABI, signer);
      const value = info.mintPrice * BigInt(qty);
      const tx = await nft.mint(qty, { value });
      const receipt = await tx.wait();

      const event = receipt?.logs
        .map((log: { topics: string[]; data: string }) => {
          try { return nft.interface.parseLog(log); } catch { return null; }
        })
        .find((e: { name: string } | null) => e?.name === 'Minted');

      setMintedId(event?.args?.tokenId?.toString() || 'unknown');

      // Refresh
      const totalMinted = await nft.totalMinted();
      setInfo(prev => prev ? { ...prev, totalMinted } : prev);
    } catch (err) {
      console.error('Mint failed:', err);
      alert('Mint failed. Check console.');
    } finally {
      setIsMinting(false);
    }
  };

  if (loading) return <div style={styles.page}><p style={{ color: '#555', paddingTop: 120 }}>Loading collection...</p></div>;
  if (!info) return <div style={styles.page}><p style={{ color: '#555', paddingTop: 120 }}>Collection not found.</p></div>;

  const priceFmt = info.mintPrice === 0n ? 'Free' : `${formatEther(info.mintPrice)} ETH`;
  const totalCost = info.mintPrice === 0n ? 'Free' : `${formatEther(info.mintPrice * BigInt(qty))} ETH`;
  const remaining = info.maxSupply - info.totalMinted;
  const pct = Number(info.maxSupply) > 0 ? Math.round((Number(info.totalMinted) / Number(info.maxSupply)) * 100) : 0;
  const img = localStorage.getItem(`divarc_img_${address}`);
  const isOwner = walletAddress?.toLowerCase() === info.owner.toLowerCase();

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        {/* Left: Image + Info */}
        <div>
          <div style={styles.imageBox}>
            {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <span style={{ fontSize: 64, color: '#333' }}>◆</span>}
          </div>
          <div style={styles.infoCard}>
            <h3 style={{ fontSize: 12, fontWeight: 500, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Details</h3>
            <InfoRow label="Contract" value={`${address!.slice(0, 8)}...${address!.slice(-6)}`} />
            <InfoRow label="Standard" value="ERC-721" />
            <InfoRow label="Network" value="Arc Testnet" />
            {info.hasCommit && <InfoRow label="Encrypted Reveal" value={info.revealed ? '✅ Revealed' : '🔐 Hidden'} />}
            <div style={{ marginTop: 12 }}>
              <a href={`${ARC_TESTNET.blockExplorer}/address/${address}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#00ff88' }}>
                View on Explorer ↗
              </a>
            </div>
          </div>
        </div>

        {/* Right: Mint */}
        <div>
          <div style={styles.mintCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{info.name}</h1>
              <span style={{ fontSize: 13, color: '#00ff88', fontWeight: 600 }}>{info.symbol}</span>
            </div>
            {info.description && <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>{info.description}</p>}

            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{info.totalMinted.toString()} / {info.maxSupply.toString()}</span>
                <span style={{ fontSize: 13, color: '#555' }}>{pct}% minted</span>
              </div>
              <div style={styles.bar}><div style={{ ...styles.barFill, width: `${pct}%` }} /></div>
            </div>

            {/* Price */}
            <div style={styles.priceRow}>
              <span style={{ fontSize: 13, color: '#555' }}>Price per NFT</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{priceFmt}</span>
            </div>

            {/* Qty selector */}
            {remaining > 0n && (
              <>
                <div style={styles.qtyRow}>
                  <span style={{ fontSize: 13, color: '#555' }}>Quantity</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button style={styles.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', minWidth: 24, textAlign: 'center' }}>{qty}</span>
                    <button style={styles.qtyBtn} onClick={() => setQty(Math.min(Number(remaining), qty + 1))}>+</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 13, color: '#555' }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#00ff88' }}>{totalCost}</span>
                </div>
              </>
            )}

            {/* Mint button */}
            {remaining > 0n ? (
              <button style={{ ...styles.mintBtn, opacity: !walletAddress || isMinting ? 0.4 : 1 }} disabled={!walletAddress || isMinting} onClick={handleMint}>
                {!walletAddress ? 'Connect Wallet to Mint' : isMinting ? 'Minting...' : `Mint ${qty} NFT${qty > 1 ? 's' : ''}`}
              </button>
            ) : (
              <div style={{ ...styles.mintBtn, background: '#333', cursor: 'default' }}>Sold Out</div>
            )}

            {mintedId && (
              <div style={{ marginTop: 14, padding: 14, background: 'rgba(0,255,136,0.06)', borderRadius: 8, border: '1px solid rgba(0,255,136,0.15)' }}>
                <p style={{ fontSize: 13, color: '#00ff88' }}>🎉 Minted NFT #{mintedId}</p>
              </div>
            )}

            {/* Owner reveal button */}
            {isOwner && info.hasCommit && !info.revealed && (
              <button style={styles.revealBtn} onClick={async () => {
                const storedURI = localStorage.getItem(`divarc_baseuri_${info.name}_${info.symbol}`);
                const storedSalt = localStorage.getItem(`divarc_salt_${info.name}_${info.symbol}`);
                if (!storedURI || !storedSalt || !signer) {
                  alert('Reveal data not found in this browser. You need the same browser you used to create.');
                  return;
                }
                try {
                  const nft = new Contract(address!, NFT_COLLECTION_ABI, signer);
                  const tx = await nft.reveal(storedURI, storedSalt);
                  await tx.wait();
                  setInfo(prev => prev ? { ...prev, revealed: true } : prev);
                  alert('Collection revealed!');
                } catch (err) {
                  console.error('Reveal failed:', err);
                  alert('Reveal failed.');
                }
              }}>
                🔓 Reveal Metadata
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{value}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' },
  imageBox: { width: '100%', aspectRatio: '1', background: '#0a0a0a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 16 },
  infoCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: 20 },
  mintCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: 28 },
  bar: { height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', background: '#00ff88', borderRadius: 2, transition: 'width 0.3s' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #1a1a1a' },
  qtyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #1a1a1a' },
  qtyBtn: { width: 32, height: 32, borderRadius: 6, background: '#1a1a1a', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222' },
  mintBtn: { width: '100%', padding: '14px', background: '#00ff88', color: '#000', fontSize: 15, fontWeight: 700, borderRadius: 8, cursor: 'pointer', marginTop: 20, textAlign: 'center', border: 'none' },
  revealBtn: { width: '100%', padding: '12px', background: 'transparent', color: '#a78bfa', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', marginTop: 12, border: '1px solid #a78bfa', textAlign: 'center' },
};
