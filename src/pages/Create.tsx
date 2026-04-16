import { useState, type CSSProperties } from 'react';
import { Contract, parseEther, keccak256, toUtf8Bytes, randomBytes, hexlify } from 'ethers';
import type { JsonRpcSigner } from 'ethers';
import { ARC_TESTNET } from '../config/network';
import { NFT_FACTORY_ABI } from '../config/abis';

interface CreateProps {
  walletAddress: string | null;
  signer: JsonRpcSigner | null;
}

const STEPS = ['Collection Details', 'Mint Settings', 'Encrypted Reveal', 'Review & Deploy'];

export function Create({ walletAddress, signer }: CreateProps) {
  const [step, setStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [maxSupply, setMaxSupply] = useState('');
  const [mintPrice, setMintPrice] = useState('');
  const [enableReveal, setEnableReveal] = useState(true);
  const [hiddenURI, setHiddenURI] = useState('');
  const [baseURI, setBaseURI] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const canNext = () => {
    if (step === 0) return name && symbol && maxSupply;
    if (step === 1) return mintPrice;
    return true;
  };

  const handleDeploy = async () => {
    if (!walletAddress || !signer) {
      alert('Connect your wallet first');
      return;
    }
    if (!ARC_TESTNET.contracts.nftFactory) {
      alert('NFTFactory not deployed yet. Deploy contracts first.');
      return;
    }

    setIsDeploying(true);
    try {
      const factory = new Contract(ARC_TESTNET.contracts.nftFactory, NFT_FACTORY_ABI, signer);

      // Generate commit hash for encrypted reveal
      let commitHash = '0x' + '0'.repeat(64);
      const salt = hexlify(randomBytes(32));

      if (enableReveal && baseURI) {
        const packed = toUtf8Bytes(baseURI + salt);
        commitHash = keccak256(packed);
        // Store salt locally so owner can reveal later
        localStorage.setItem(`divarc_salt_${name}_${symbol}`, salt);
        localStorage.setItem(`divarc_baseuri_${name}_${symbol}`, baseURI);
      }

      const priceWei = parseEther(mintPrice || '0');

      const tx = await factory.createCollection(
        name,
        symbol,
        BigInt(maxSupply),
        priceWei,
        description,
        hiddenURI || 'ipfs://hidden',
        commitHash,
      );

      const receipt = await tx.wait();

      const event = receipt?.logs
        .map((log: { topics: string[]; data: string }) => {
          try { return factory.interface.parseLog(log); } catch { return null; }
        })
        .find((e: { name: string } | null) => e?.name === 'CollectionCreated');

      const addr = event?.args?.collectionAddress;
      if (addr) {
        setDeployedAddress(addr);
        if (imagePreview) {
          localStorage.setItem(`divarc_img_${addr}`, imagePreview);
        }
      }
    } catch (err) {
      console.error('Deploy failed:', err);
      alert('Deployment failed. Check console.');
    } finally {
      setIsDeploying(false);
    }
  };

  if (deployedAddress) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Collection Deployed!</h2>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>{name} ({symbol})</p>
          <div style={styles.addressBox}>
            <span style={{ fontSize: 13, color: '#00ff88', fontFamily: 'monospace', wordBreak: 'break-all' }}>{deployedAddress}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <a href={`${ARC_TESTNET.blockExplorer}/address/${deployedAddress}`} target="_blank" rel="noreferrer" style={styles.linkBtn}>
              View on Explorer ↗
            </a>
            <a href={`/collection/${deployedAddress}`} style={styles.primaryBtn}>
              Go to Mint Page
            </a>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.tag}>CREATE COLLECTION</p>
        <h1 style={styles.title}>Launch your NFT collection</h1>
        <p style={styles.subtitle}>Deploy an ERC-721 collection with optional encrypted reveal on Arc Testnet.</p>
      </div>

      {/* Progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressLabels}>
          {STEPS.map((s, i) => (
            <span key={s} style={{ fontSize: 12, fontWeight: 500, color: i <= step ? '#fff' : '#333' }}>{s}</span>
          ))}
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
      </div>

      {/* Layout */}
      <div style={styles.layout}>
        {/* Preview */}
        <div style={styles.previewCol}>
          <div style={styles.previewCard}>
            <p style={styles.previewLabel}>COLLECTION PREVIEW</p>
            <div style={styles.previewImage}>
              {imagePreview
                ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                : <span style={{ fontSize: 36, color: '#333' }}>◆</span>
              }
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 14 }}>{name || 'Collection Name'}</h3>
            <p style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>{symbol || 'SYMBOL'}</p>
            <div style={styles.previewDivider} />
            <PreviewRow label="Supply" value={maxSupply ? Number(maxSupply).toLocaleString() : '—'} />
            <PreviewRow label="Mint Price" value={mintPrice ? `${mintPrice} ETH` : '—'} />
            <PreviewRow label="Encrypted Reveal" value={enableReveal ? '🔐 Yes' : 'No'} />
            <div style={styles.previewDivider} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88' }} />
              <span style={{ fontSize: 12, color: '#555' }}>Arc Testnet</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={styles.formCol}>
          <div style={styles.card}>
            {step === 0 && (
              <div style={styles.fields}>
                <Field label="Collection Name" placeholder="e.g. Cyber Apes" value={name} onChange={setName} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <Field label="Symbol" placeholder="e.g. CAPE" value={symbol} onChange={(v) => setSymbol(v.toUpperCase())} />
                  <Field label="Max Supply" placeholder="e.g. 10000" value={maxSupply} onChange={(v) => setMaxSupply(v.replace(/\D/g, ''))} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                    placeholder="Describe your collection..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Cover Image</label>
                  <div style={styles.uploadArea}>
                    {imagePreview
                      ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={styles.uploadPlaceholder}><span style={{ fontSize: 18, color: '#444' }}>↑</span><span style={{ fontSize: 11, color: '#444' }}>Upload</span></div>
                    }
                    <input type="file" accept="image/*" style={styles.fileInput} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={styles.fields}>
                <Field label="Mint Price (ETH)" placeholder="e.g. 0.01" value={mintPrice} onChange={(v) => setMintPrice(v.replace(/[^0-9.]/g, ''))} />
                <div style={styles.infoBox}>
                  <p style={{ fontSize: 13, color: '#888' }}>💡 Mint price is paid in ETH (Arc Testnet native currency). Set to 0 for free mints.</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={styles.fields}>
                <div style={styles.toggleRow}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Enable Encrypted Reveal</p>
                    <p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Hide metadata until you choose to reveal. Uses commit-reveal pattern for fairness.</p>
                  </div>
                  <button
                    style={{ ...styles.toggle, background: enableReveal ? '#00ff88' : '#222' }}
                    onClick={() => setEnableReveal(!enableReveal)}
                  >
                    <div style={{ ...styles.toggleDot, transform: enableReveal ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                </div>

                {enableReveal && (
                  <>
                    <Field label="Hidden Metadata URI" placeholder="ipfs://... (shown before reveal)" value={hiddenURI} onChange={setHiddenURI} />
                    <Field label="Real Base URI" placeholder="ipfs://... (revealed after)" value={baseURI} onChange={setBaseURI} />
                    <div style={styles.infoBox}>
                      <p style={{ fontSize: 13, color: '#a78bfa' }}>🔐 The real metadata URI will be hashed on-chain. Only you can reveal it by providing the matching URI + salt. No one — not even the contract — can see the real metadata early.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div style={styles.fields}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Confirm & Deploy</h3>
                <p style={{ fontSize: 13, color: '#555', marginTop: -8 }}>Review everything before deploying. This is irreversible.</p>
                <div style={styles.reviewGrid}>
                  <ReviewRow label="Name" value={name} />
                  <ReviewRow label="Symbol" value={symbol} />
                  <ReviewRow label="Max Supply" value={Number(maxSupply).toLocaleString()} />
                  <ReviewRow label="Mint Price" value={`${mintPrice} ETH`} />
                  <ReviewRow label="Description" value={description || '—'} />
                  <ReviewRow label="Encrypted Reveal" value={enableReveal ? 'Yes' : 'No'} />
                </div>
              </div>
            )}

            {/* Nav */}
            <div style={styles.nav}>
              {step > 0 && <button style={styles.backBtn} onClick={() => setStep(s => s - 1)}>Back</button>}
              <div style={{ flex: 1 }} />
              {step < 3 ? (
                <button style={{ ...styles.nextBtn, opacity: canNext() ? 1 : 0.3 }} disabled={!canNext()} onClick={() => setStep(s => s + 1)}>Continue</button>
              ) : (
                <button style={{ ...styles.deployBtn, opacity: isDeploying ? 0.5 : 1 }} disabled={isDeploying} onClick={handleDeploy}>
                  {isDeploying ? 'Deploying...' : 'Deploy Collection'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
      <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{value}</span>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ fontSize: 13, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px' },
  header: { marginBottom: 28 },
  tag: { fontSize: 11, fontWeight: 500, color: '#00ff88', marginBottom: 12, letterSpacing: '0.15em' },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' },
  subtitle: { fontSize: 15, color: '#555', lineHeight: 1.6, maxWidth: 520 },

  progressWrap: { marginBottom: 32 },
  progressLabels: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  progressTrack: { height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' },
  progressBar: { height: '100%', background: '#00ff88', borderRadius: 1, transition: 'width 0.4s ease' },

  layout: { display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24, alignItems: 'start' },
  previewCol: { position: 'sticky', top: 80 },
  previewCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: 22 },
  previewLabel: { fontSize: 11, fontWeight: 500, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 },
  previewImage: { width: '100%', aspectRatio: '1', background: '#0a0a0a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewDivider: { height: 1, background: '#1a1a1a', margin: '12px 0' },

  formCol: {},
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: 28 },
  fields: { display: 'flex', flexDirection: 'column', gap: 18 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label: { fontSize: 12, fontWeight: 500, color: '#555', letterSpacing: '0.02em', textTransform: 'uppercase' },
  input: { background: '#000', border: '1px solid #1a1a1a', borderRadius: 6, padding: '11px 14px', fontSize: 14, color: '#fff', width: '100%' },

  uploadArea: { position: 'relative', width: 80, height: 80, borderRadius: 8, border: '1px dashed #222', overflow: 'hidden', cursor: 'pointer' },
  uploadPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
  fileInput: { position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' },

  infoBox: { background: 'rgba(0,255,136,0.04)', border: '1px solid #1a1a1a', borderRadius: 8, padding: 14 },

  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' },
  toggleDot: { width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: 3, transition: 'transform 0.2s' },

  reviewGrid: { display: 'flex', flexDirection: 'column' },

  nav: { display: 'flex', alignItems: 'center', marginTop: 28, gap: 10 },
  backBtn: { fontSize: 13, fontWeight: 500, color: '#555', padding: '10px 18px', borderRadius: 6, border: '1px solid #222', background: 'transparent', cursor: 'pointer' },
  nextBtn: { fontSize: 13, fontWeight: 600, color: '#000', padding: '10px 22px', borderRadius: 6, background: '#00ff88', cursor: 'pointer', transition: 'opacity 0.2s' },
  deployBtn: { fontSize: 13, fontWeight: 600, color: '#000', padding: '10px 22px', borderRadius: 6, background: '#00ff88', cursor: 'pointer' },

  successCard: { maxWidth: 500, margin: '120px auto', background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 40, textAlign: 'center' },
  addressBox: { background: '#000', border: '1px solid #1a1a1a', borderRadius: 8, padding: 14 },
  linkBtn: { fontSize: 13, fontWeight: 500, color: '#fff', padding: '10px 18px', borderRadius: 6, border: '1px solid #222', textDecoration: 'none' },
  primaryBtn: { fontSize: 13, fontWeight: 600, color: '#000', padding: '10px 22px', borderRadius: 6, background: '#00ff88', textDecoration: 'none' },
};
