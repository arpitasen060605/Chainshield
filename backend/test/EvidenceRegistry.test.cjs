const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvidenceRegistry Smart Contract Test Suite", function () {
  let registry;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
    registry = await EvidenceRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("1. Should deploy EvidenceRegistry contract cleanly", async function () {
    const address = await registry.getAddress();
    expect(address).to.be.a("string");
    expect(address.startsWith("0x")).to.be.true;
  });

  it("2. Should store evidence hash and emit EvidenceHashStored event", async function () {
    const evidenceId = "EVD-000001";
    const sha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    await expect(registry.connect(owner).storeEvidenceHash(evidenceId, sha256Hash))
      .to.emit(registry, "EvidenceHashStored")
      .withArgs(evidenceId, sha256Hash, (ts) => ts > 0, owner.address);
  });

  it("3. Should retrieve evidence hash accurately from contract storage", async function () {
    const evidenceId = "EVD-000002";
    const sha256Hash = "8a2f3b9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a";

    await registry.storeEvidenceHash(evidenceId, sha256Hash);

    const [storedHash, timestamp, submitter] = await registry.getEvidenceHash(evidenceId);
    expect(storedHash).to.equal(sha256Hash);
    expect(timestamp).to.be.above(0);
    expect(submitter).to.equal(owner.address);
  });

  it("4. Should verify matching hash returns true", async function () {
    const evidenceId = "EVD-000003";
    const sha256Hash = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";

    await registry.storeEvidenceHash(evidenceId, sha256Hash);

    const isMatch = await registry.verifyEvidence(evidenceId, sha256Hash);
    expect(isMatch).to.be.true;
  });

  it("5. Should detect mismatching hash and return false", async function () {
    const evidenceId = "EVD-000004";
    const realHash = "1111111111111111111111111111111111111111111111111111111111111111";
    const tamperedHash = "9999999999999999999999999999999999999999999999999999999999999999";

    await registry.storeEvidenceHash(evidenceId, realHash);

    const isMatch = await registry.verifyEvidence(evidenceId, tamperedHash);
    expect(isMatch).to.be.false;
  });

  it("6. Should reject duplicate evidence ID registration", async function () {
    const evidenceId = "EVD-000005";
    const sha256Hash = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";

    await registry.storeEvidenceHash(evidenceId, sha256Hash);

    await expect(
      registry.storeEvidenceHash(evidenceId, sha256Hash)
    ).to.be.revertedWith("Evidence record already exists");
  });

  it("7. Should reject empty evidence ID", async function () {
    await expect(
      registry.storeEvidenceHash("", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2")
    ).to.be.revertedWith("Evidence ID cannot be empty");
  });

  it("8. Should reject empty SHA-256 hash", async function () {
    await expect(
      registry.storeEvidenceHash("EVD-000006", "")
    ).to.be.revertedWith("SHA-256 hash cannot be empty");
  });
});
