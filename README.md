# ArcNFTs

**NFT Collection Launchpad for ARC Network** — Create, deploy & mint NFT collections with encrypted metadata reveal. No code required.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/Windwalkermonk/arcnfts)

**Live:** [arcnfts.vercel.app](https://arcnfts.vercel.app)

---

## Features

- **No-Code Deploy** — Fill in the form, click deploy. Your NFT collection is live on Arc in one transaction.
- **Encrypted Reveal (Commit-Reveal)** — Metadata is hashed on-chain. Nobody can see the real art until the creator reveals it.
- **ERC-2981 Royalties** — Built-in royalty standard. Secondary sales automatically pay the creator.
- **Mint Pages** — Every collection gets its own shareable mint page with progress bar.
- **Arc Native** — Sub-second finality, USDC as native gas token, Circle's stablecoin L1.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend (React)                │
│  Home · Create Wizard · Explore · Mint · Portfolio│
├──────────────────────────────────────────────────┤
│                  ethers.js v6                     │
├──────────────────────────────────────────────────┤
│              ARC Testnet (Chain 5042002)          │
│  ┌─────────────┐    ┌──────────────────────────┐ │
│  │ NFTFactory  │───>│ NFTCollection (per user)  │ │
│  │ (singleton) │    │ ERC-721 + ERC-2981        │ │
│  └─────────────┘    │ + Commit-Reveal           │ │
│                     └──────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Contracts | Solidity 0.8.24 + OpenZeppelin v5 |
| Tooling | Hardhat 3 |
| Network | ARC Testnet (Chain ID: 5042002) |
| Wallet | MetaMask / Rabby / any ERC wallet |
| Hosting | Vercel (auto-deploy on push) |

---

## Smart Contracts

### NFTFactory.sol

Factory pattern — deploys new NFT collections in a single transaction.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./NFTCollection.sol";

contract NFTFactory {
    event CollectionCreated(address indexed collection, address indexed creator);

    address[] public allCollections;

    function createCollection(
        string calldata name_,
        string calldata symbol_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        string calldata description_,
        address royaltyRecipient_,
        uint96 royaltyBps_
    ) external returns (address) {
        NFTCollection c = new NFTCollection(
            name_, symbol_, maxSupply_, mintPrice_, description_,
            msg.sender, royaltyRecipient_, royaltyBps_
        );
        address addr = address(c);
        allCollections.push(addr);
        emit CollectionCreated(addr, msg.sender);
        return addr;
    }

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    function getCollectionCount() external view returns (uint256) {
        return allCollections.length;
    }
}
```

### NFTCollection.sol

Each collection is a standalone ERC-721 + ERC-2981 contract with encrypted reveal.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTCollection is ERC721, ERC2981, Ownable {
    using Strings for uint256;

    uint256 public maxSupply;
    uint256 public mintPrice;
    uint256 public totalMinted;
    string public collectionDescription;
    bool public revealed;
    string private _baseTokenURI;
    string private _hiddenURI;
    bytes32 public metadataCommitHash;

    event Minted(address indexed to, uint256 indexed tokenId);
    event Revealed(string baseURI);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        string memory description_,
        address creator_,
        address royaltyRecipient_,
        uint96 royaltyBps_
    ) ERC721(name_, symbol_) Ownable(creator_) {
        maxSupply = maxSupply_;
        mintPrice = mintPrice_;
        collectionDescription = description_;
        if (royaltyRecipient_ != address(0)) {
            _setDefaultRoyalty(royaltyRecipient_, royaltyBps_);
        }
    }

    function mint(uint256 quantity) external payable {
        require(totalMinted + quantity <= maxSupply, "Exceeds max supply");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        for (uint256 i = 0; i < quantity; i++) {
            totalMinted++;
            _safeMint(msg.sender, totalMinted);
            emit Minted(msg.sender, totalMinted);
        }
    }

    /// @notice Reveal metadata — verifiable against on-chain commit hash
    function reveal(string calldata baseURI_, bytes32 salt_) external onlyOwner {
        require(!revealed, "Already revealed");
        require(
            keccak256(abi.encodePacked(baseURI_, salt_)) == metadataCommitHash,
            "Invalid reveal: hash mismatch"
        );
        _baseTokenURI = baseURI_;
        revealed = true;
        emit Revealed(baseURI_);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed && bytes(_hiddenURI).length > 0) return _hiddenURI;
        if (bytes(_baseTokenURI).length > 0)
            return string.concat(_baseTokenURI, tokenId.toString(), ".json");
        return "";
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }
}
```

---

## Encrypted Reveal — How It Works

```
Creator                          Contract                      Buyers
   │                                │                            │
   │ 1. commit(hash(realURI+salt))  │                            │
   │ ──────────────────────────────>│                            │
   │                                │  metadataCommitHash stored │
   │                                │                            │
   │                                │  2. mint() ◄───────────────│
   │                                │     tokenURI → hiddenURI   │
   │                                │                            │
   │ 3. reveal(realURI, salt)       │                            │
   │ ──────────────────────────────>│                            │
   │    verify: hash(URI+salt)==commit                           │
   │                                │  tokenURI → realURI/N.json │
   │                                │                            │
```

1. **Commit** — Creator hashes the real metadata URI + random salt, stores hash on-chain
2. **Mint** — Buyers mint NFTs, see only the hidden placeholder metadata
3. **Reveal** — Creator submits the real URI + salt. Contract verifies `keccak256(URI + salt) == commitHash`. If valid, all tokens now point to real metadata.

**Why this matters:** No one — not even the contract owner — can front-run or manipulate the reveal. The hash is a binding commitment.

---

## Quick Start

```bash
# Clone
git clone https://github.com/Windwalkermonk/arcnfts.git
cd arcnfts

# Install
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

### Compile Contracts

```bash
# Install solc
npm install -g solc

# Compile
npx solcjs --abi --bin \
  --include-path node_modules \
  --base-path . \
  contracts/NFTFactory.sol contracts/NFTCollection.sol \
  -o build
```

### Deploy to ARC Testnet

```bash
npx hardhat run scripts/deploy.ts --network arcTestnet
```

---

## ARC Network

| Property | Value |
|----------|-------|
| Chain ID | `5042002` |
| RPC | `https://rpc.quicknode.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Gas Token | USDC (native) |
| Finality | Sub-second, deterministic |

### Add to MetaMask

The app automatically prompts to add Arc Testnet. Manual setup:

| Field | Value |
|-------|-------|
| Network Name | Arc Testnet |
| RPC URL | `https://rpc.quicknode.testnet.arc.network` |
| Chain ID | `5042002` |
| Symbol | USDC |
| Explorer | `https://testnet.arcscan.app` |

### Get Testnet USDC

Visit [faucet.circle.com](https://faucet.circle.com) → Select **Arc Testnet** → Paste your wallet address.

---

## Project Structure

```
arcnfts/
├── contracts/
│   ├── NFTCollection.sol    # ERC-721 + ERC-2981 + commit-reveal
│   └── NFTFactory.sol       # Factory pattern for one-tx deploys
├── src/
│   ├── components/
│   │   └── Navbar.tsx
│   ├── config/
│   │   ├── abis.ts          # Contract ABIs
│   │   ├── bytecodes.ts     # Compiled bytecode (auto-deploy)
│   │   └── network.ts       # Arc Testnet config
│   ├── hooks/
│   │   └── useWallet.ts     # Wallet connect + chain switch
│   ├── pages/
│   │   ├── Home.tsx          # Landing + recent collections
│   │   ├── Create.tsx        # 4-step creation wizard
│   │   ├── Explore.tsx       # Browse all collections
│   │   ├── Collection.tsx    # Mint page per collection
│   │   └── Portfolio.tsx     # User's collections
│   ├── App.tsx
│   └── main.tsx
├── hardhat.config.ts
├── package.json
└── vercel.json               # SPA rewrites
```

---

## License

MIT
