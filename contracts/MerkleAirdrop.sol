// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop {
    address private owner;
    IERC20 private immutable token;
    IERC721 private immutable baycNFT;
    bytes32 private merkleRoot;
    mapping(address => bool) public claimed;

    event Claimed(address indexed claimant, uint256 amount);
    event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event Withdrawn(uint256 amount);

    error UNAUTHORIZED();
    error AIRDROP_CLAIMED();
    error INVALID_PROOF();
    error TRANSFER_FAILED();
    error WITHDRAWAL_FAILED();
    error NO_BAYC_OWNERSHIP();

    constructor(
        address _tokenAddress,
        address _baycNFTAddress,
        bytes32 _merkleRoot
    ) {
        token = IERC20(_tokenAddress);
        baycNFT = IERC721(_baycNFTAddress);
        merkleRoot = _merkleRoot;
        owner = msg.sender;
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        if (claimed[msg.sender]) revert AIRDROP_CLAIMED();
        if (baycNFT.balanceOf(msg.sender) == 0) revert NO_BAYC_OWNERSHIP(); // Check BAYC ownership

        bytes32 node = keccak256(abi.encodePacked(msg.sender, amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, node))
            revert INVALID_PROOF();

        claimed[msg.sender] = true;
        if (!token.transfer(msg.sender, amount)) revert TRANSFER_FAILED();

        emit Claimed(msg.sender, amount);
    }

    function updateMerkleRoot(bytes32 newRoot) external {
        onlyOwner();
        bytes32 oldRoot = merkleRoot;
        if (newRoot != oldRoot) {
            merkleRoot = newRoot;
        }
        emit MerkleRootUpdated(oldRoot, newRoot);
    }

    function withdrawRemainingTokens() external {
        onlyOwner();
        uint256 balance = token.balanceOf(address(this));
        if (!token.transfer(owner, balance)) revert WITHDRAWAL_FAILED();
        emit Withdrawn(balance);
    }

    function onlyOwner() private view {
        if (msg.sender != owner) revert UNAUTHORIZED();
    }
}
