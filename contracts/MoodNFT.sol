// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MoodNFT is ERC721, ERC721URIStorage {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenMoods;

    constructor() ERC721("MoodNFT", "MOOD") {}

    function mintMood(address to, string memory uri, string memory mood) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _tokenMoods[tokenId] = mood;
        return tokenId;
    }

    function getMood(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "MoodNFT: Query for nonexistent token");
        require(ownerOf(tokenId) == _msgSender(), "MoodNFT: Caller is not the token owner");
        return _tokenMoods[tokenId];
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}