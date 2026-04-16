// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./NFTCollection.sol";

contract NFTFactory {
    event CollectionCreated(
        address indexed collectionAddress,
        string name,
        string symbol,
        uint256 maxSupply,
        uint256 mintPrice,
        bool hasEncryptedReveal,
        address indexed creator
    );

    address[] public allCollections;

    function createCollection(
        string calldata name_,
        string calldata symbol_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        string calldata description_,
        string calldata hiddenURI_,
        bytes32 metadataCommitHash_
    ) external returns (address) {
        NFTCollection collection = new NFTCollection(
            name_,
            symbol_,
            maxSupply_,
            mintPrice_,
            description_,
            hiddenURI_,
            metadataCommitHash_,
            msg.sender
        );

        address addr = address(collection);
        allCollections.push(addr);

        emit CollectionCreated(
            addr,
            name_,
            symbol_,
            maxSupply_,
            mintPrice_,
            metadataCommitHash_ != bytes32(0),
            msg.sender
        );

        return addr;
    }

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    function getCollectionCount() external view returns (uint256) {
        return allCollections.length;
    }
}
