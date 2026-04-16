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

    function configure(string calldata hiddenURI_, bytes32 commitHash_) external onlyOwner {
        require(totalMinted == 0, "Already minting");
        _hiddenURI = hiddenURI_;
        metadataCommitHash = commitHash_;
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
        if (!revealed && bytes(_hiddenURI).length > 0) {
            return _hiddenURI;
        }
        if (bytes(_baseTokenURI).length > 0) {
            return string.concat(_baseTokenURI, tokenId.toString(), ".json");
        }
        return "";
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }
}
