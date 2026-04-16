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
        string calldata description_
    ) external returns (address) {
        NFTCollection c = new NFTCollection(
            name_, symbol_, maxSupply_, mintPrice_, description_, msg.sender
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
