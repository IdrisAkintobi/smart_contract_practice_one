import { expect } from "chai";
import { ethers } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Token contract", function () {
  async function deployTokenFixture() {
    // Get the Signers here.
    const [owner, addr1, addr2] = await ethers.getSigners();

    const iDrisToken = await ethers.deployContract("IDrisToken", owner);
    await iDrisToken.waitForDeployment();

    return { iDrisToken, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { iDrisToken, owner } = await loadFixture(deployTokenFixture);

      expect(await iDrisToken.owner()).to.equal(owner);
    });

    it("Should assign initial amount to the owner", async function () {
      const initialAmount = ethers.parseUnits("100000", 18);
      const { iDrisToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await iDrisToken.balanceOf(owner);
      expect(ownerBalance).to.equal(initialAmount);
    });
  });
});
