// MockBAYC.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockBAYC is ERC721 {
    uint256 private _tokenIds;

    constructor() ERC721("BoredApeYachtClub", "BAYC") {}

    function mint(address to) external {
        _tokenIds += 1;
        _mint(to, _tokenIds);
    }
}
