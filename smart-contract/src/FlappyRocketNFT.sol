// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/token/ERC721/ERC721.sol";
import "@openzeppelin/utils/Base64.sol";
import "@openzeppelin/utils/Strings.sol";

contract FlappyRocketNFT is ERC721 {
    uint256 public tokenIdCounter;

    // Stores SVG image data directly on-chain
    mapping(uint256 => string) private _tokenSVGs;

    constructor() ERC721("FlappyRocket", "FLPY") {}

    function mintNFT(string memory username, uint256 score) public {
        tokenIdCounter++;
        uint256 newTokenId = tokenIdCounter;

        // 1. Generate SVG with dynamic username/score
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">',
                '<rect width="100%" height="100%" fill="#1A1A2E"/>',
                '<text x="50%" y="40%" fill="white" font-family="Arial" font-size="24" text-anchor="middle">',
                "Flappy Rocket Player",
                "</text>",
                '<text x="50%" y="50%" fill="#FF2D75" font-family="Arial" font-size="36" text-anchor="middle">',
                username,
                "</text>",
                '<text x="50%" y="60%" fill="white" font-family="Arial" font-size="24" text-anchor="middle">',
                "Score: ",
                Strings.toString(score),
                "</text>",
                "</svg>"
            )
        );

        // 2. Store SVG in contract storage
        _tokenSVGs[newTokenId] = svg;

        // 3. Mint NFT
        _safeMint(msg.sender, newTokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        // FIX: Use ownerOf() to check existence (reverts if token doesn't exist)
        ownerOf(tokenId); // This will revert if tokenId doesn't exist

        // On-chain SVG -> Base64 JSON metadata
        string memory svg = _tokenSVGs[tokenId];
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Flappy Rocket #',
                        Strings.toString(tokenId),
                        '",',
                        '"description": "On-chain NFT with dynamic username/score",',
                        '"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
