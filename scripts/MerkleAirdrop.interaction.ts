import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import {
  generateMerkleProof,
  getMerkleRoot,
} from "../scripts/merkle-tree-generator";
import { IDrisToken, MerkleAirdrop } from "../typechain-types";

async function main() {
  const baycNFTAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
  const merkleRoot = await getMerkleRoot();
  let iDrisToken: IDrisToken;
  let merkleAirdrop: MerkleAirdrop;
  const TOKEN_HOLDER = "0x00000000b3daca9d0452fd19b121e6484def1140";
  const AMOUNT = "9";
  const merkleProof = await generateMerkleProof(TOKEN_HOLDER, AMOUNT);

  await impersonateAccount(TOKEN_HOLDER);
  const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

  const iDrisTokenFactory = await ethers.getContractFactory(
    "IDrisToken",
    impersonatedSigner
  );
  iDrisToken = await iDrisTokenFactory.deploy();

  const merkleAirdropFactory = await ethers.getContractFactory(
    "MerkleAirdrop",
    impersonatedSigner
  );

  merkleAirdrop = await merkleAirdropFactory.deploy(
    iDrisToken,
    baycNFTAddress,
    merkleRoot
  );

  const tx = await merkleAirdrop.claim(200, merkleProof);
  const receipt = tx.wait();

  console.log({ receipt });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
