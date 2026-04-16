export const NFT_FACTORY_ABI = [
  'function createCollection(string calldata name_, string calldata symbol_, uint256 maxSupply_, uint256 mintPrice_, string calldata description_, address royaltyRecipient_, uint96 royaltyBps_) external returns (address)',
  'function getAllCollections() external view returns (address[])',
  'function getCollectionCount() external view returns (uint256)',
  'event CollectionCreated(address indexed collection, address indexed creator)',
];

export const NFT_COLLECTION_ABI = [
  'function mint(uint256 quantity) external payable',
  'function configure(string calldata hiddenURI_, bytes32 commitHash_) external',
  'function reveal(string calldata baseURI_, bytes32 salt_) external',
  'function withdraw() external',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function maxSupply() view returns (uint256)',
  'function mintPrice() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function collectionDescription() view returns (string)',
  'function revealed() view returns (bool)',
  'function metadataCommitHash() view returns (bytes32)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function owner() view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)',
  'event Minted(address indexed to, uint256 indexed tokenId)',
  'event Revealed(string baseURI)',
];
