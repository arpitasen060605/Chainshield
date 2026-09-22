const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==========================================");
  console.log("Deploying ChainShield EvidenceRegistry...");
  console.log("==========================================");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Deployer Account: ${deployer.address}`);
  console.log(`Account Balance:  ${ethers.formatEther(balance)} ETH`);

  const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
  console.log("Starting contract deployment transaction...");
  const registry = await EvidenceRegistry.deploy();
  console.log(
    "Transaction submitted:",
    registry.deploymentTransaction()?.hash
  );
  console.log("Waiting for blockchain confirmation...");
  await registry.waitForDeployment();

  console.log("Contract deployment confirmed!");

  const contractAddress = await registry.getAddress();
  const txHash = registry.deploymentTransaction() ? registry.deploymentTransaction().hash : "N/A";

  console.log("\n------------------------------------------");
  console.log(`✓ EvidenceRegistry deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployment Tx:   ${txHash}`);
  console.log("------------------------------------------\n");

  console.log(`Set the following in backend/.env:`);
  console.log(`EVIDENCE_REGISTRY_CONTRACT_ADDRESS=${contractAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
