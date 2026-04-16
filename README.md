# DivArc

NFT Collection Launchpad for **ARC Network** — Create, deploy & mint NFT collections with encrypted reveal.

## Features

- **No-Code Deploy** — Fill in the form, click deploy. Your NFT collection is live on Arc in seconds.
- **Encrypted Reveal** — Hide metadata until you're ready. Commit-reveal pattern ensures fairness.
- **Mint Page** — Every collection gets a shareable mint page.
- **Arc Native** — Sub-second finality on Circle's stablecoin-native L1.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Contracts**: Solidity 0.8.24, OpenZeppelin, Hardhat
- **Network**: ARC Testnet (Chain ID: 5042002)
- **Wallet**: MetaMask (auto-adds Arc Testnet)

## Quick Start

```bash
npm install
npm run dev
```

## Contracts

| Contract | Description |
|----------|-------------|
| `NFTFactory` | Factory that deploys new NFT collections |
| `NFTCollection` | ERC-721 with mint, max supply, encrypted reveal |

### Encrypted Reveal Flow

1. Creator sets a hidden metadata URI (e.g. placeholder image)
2. Real metadata URI is hashed (keccak256) and stored on-chain as a commitment
3. After minting, creator calls `reveal(realURI, salt)` — contract verifies the hash
4. Token URIs switch from hidden to real metadata

## Deploy

Hosted on Vercel. Push to `main` triggers auto-deploy.

## ARC Network

- **Chain ID**: 5042002
- **RPC**: `https://rpc.quicknode.testnet.arc.network`
- **Explorer**: `https://testnet.arc.network`
