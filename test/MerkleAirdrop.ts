import { expect } from "chai";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { IDrisToken, MerkleAirdrop, MockBAYC } from "../typechain-types";

describe("MerkleAirdrop", function () {
  let merkleAirdrop: MerkleAirdrop;
  let iDrisToken: IDrisToken;
  let baycNFT: MockBAYC;
  let owner: any, addr1: any, addr2: any, addr3: any;
  let merkleTree: MerkleTree;
  let merkleRoot: string;
  let records: (string | bigint)[][];

  const TWO_HUNDRED_ETHERS = ethers.parseEther("200");

  function hashLeaf(leaf: (string | bigint)[]) {
    return keccak256(ethers.solidityPacked(["address", "uint256"], leaf));
  }

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy mock BAYC NFT contract
    const baycFactory = await ethers.getContractFactory("MockBAYC");
    baycNFT = await baycFactory.deploy();

    // Mint a BAYC NFT for addr1
    await baycNFT.mint(addr1.getAddress());

    // Deploy ERC20 Token
    const iDrisTokenFactory = await ethers.getContractFactory("IDrisToken");
    iDrisToken = await iDrisTokenFactory.deploy();

    // Create Merkle Tree using merkletreejs
    const addressOne = await addr1.getAddress();
    const addressTwo = await addr2.getAddress();
    records = [
      [addressOne, ethers.parseEther("40")],
      [addressTwo, ethers.parseEther("60")],
    ];

    const leaves = records.map(hashLeaf);
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Deploy MerkleAirdrop with ERC20 and BAYC contract addresses
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    merkleAirdrop = await MerkleAirdrop.deploy(iDrisToken, baycNFT, merkleRoot);

    // Transfer tokens to the MerkleAirdrop contract
    await iDrisToken.transfer(merkleAirdrop, TWO_HUNDRED_ETHERS);
  });

  it("Should allow users to claim their airdrop with valid proof if they own a BAYC NFT", async function () {
    const value = records[0][1] as bigint;
    const proof = merkleTree.getHexProof(hashLeaf(records[0]));

    await expect(merkleAirdrop.connect(addr1).claim(value, proof))
      .to.emit(merkleAirdrop, "Claimed")
      .withArgs(await addr1.getAddress(), value);

    expect(await iDrisToken.balanceOf(addr1.getAddress())).to.equal(
      ethers.parseEther("40")
    );
    expect(await merkleAirdrop.claimed(await addr1.getAddress())).to.be.true;
  });

  it("Should revert if user does not own a BAYC NFT", async function () {
    const value = records[1][1] as bigint; // addr2 does not own BAYC
    const proof = merkleTree.getHexProof(hashLeaf(records[1]));

    await expect(
      merkleAirdrop.connect(addr2).claim(value, proof)
    ).to.be.revertedWithCustomError(merkleAirdrop, "NO_BAYC_OWNERSHIP");
  });

  it("Should revert if airdrop already claimed", async function () {
    const value = records[0][1] as bigint;
    const proof = merkleTree.getHexProof(hashLeaf(records[0]));

    await merkleAirdrop.connect(addr1).claim(value, proof);
    await expect(
      merkleAirdrop.connect(addr1).claim(value, proof)
    ).to.be.revertedWithCustomError(merkleAirdrop, "AIRDROP_CLAIMED");
  });

  it("Should revert with invalid proof", async function () {
    const value = records[0][1] as bigint;
    const invalidProof: string[] = [];

    await expect(
      merkleAirdrop.connect(addr1).claim(value, invalidProof)
    ).to.be.revertedWithCustomError(merkleAirdrop, "INVALID_PROOF");
  });

  it("Should allow owner to update the Merkle root", async function () {
    const addressThree = await addr3.getAddress();
    const newRecords = [[addressThree, ethers.parseEther("50")], ...records];
    const newLeaves = newRecords.map(hashLeaf);
    const newMerkleTree = new MerkleTree(newLeaves, keccak256, {
      sortPairs: true,
    });
    const newMerkleRoot = newMerkleTree.getHexRoot();

    await expect(merkleAirdrop.updateMerkleRoot(newMerkleRoot))
      .to.emit(merkleAirdrop, "MerkleRootUpdated")
      .withArgs(merkleRoot, newMerkleRoot);
  });

  it("Should revert if non-owner tries to update the Merkle root", async function () {
    const addressThree = await addr3.getAddress();
    const newRecords = [[addressThree, ethers.parseEther("50")], ...records];
    const newLeaves = newRecords.map(hashLeaf);
    const newMerkleTree = new MerkleTree(newLeaves, keccak256, {
      sortPairs: true,
    });
    const newMerkleRoot = newMerkleTree.getHexRoot();

    await expect(
      merkleAirdrop.connect(addr1).updateMerkleRoot(newMerkleRoot)
    ).to.be.revertedWithCustomError(merkleAirdrop, "UNAUTHORIZED");
  });

  it("Should allow owner to withdraw remaining tokens", async function () {
    const balanceBeforeWithdrawal = await iDrisToken.balanceOf(
      owner.getAddress()
    );

    await expect(merkleAirdrop.withdrawRemainingTokens())
      .to.emit(merkleAirdrop, "Withdrawn")
      .withArgs(TWO_HUNDRED_ETHERS);

    const expectedBalanceAfterWithdrawal =
      balanceBeforeWithdrawal + TWO_HUNDRED_ETHERS;
    expect(await iDrisToken.balanceOf(owner.getAddress())).to.equal(
      expectedBalanceAfterWithdrawal
    );
  });

  it("Should revert if non-owner tries to withdraw tokens", async function () {
    await expect(
      merkleAirdrop.connect(addr1).withdrawRemainingTokens()
    ).to.be.revertedWithCustomError(merkleAirdrop, "UNAUTHORIZED");
  });
});
