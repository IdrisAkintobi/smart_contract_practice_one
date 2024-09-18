import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenAddress = "0x39A3bE77b7b7a574800373CE8CaFa7B5082EA82f";
const merkleRoot =
  "0x36bdd3512965b7cd6861c0938aca72fcb0d0431577ccf3fd4e7a417256b65c50";
const baycNFTAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

const MerkleAirdropModule = buildModule("MerkleAirdropModule", (m) => {
  const merkleAirdrop = m.contract("MerkleAirdrop", [
    tokenAddress,
    baycNFTAddress,
    merkleRoot,
  ]);

  return { merkleAirdrop };
});

export default MerkleAirdropModule;
