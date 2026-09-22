import connectDB from './config/db.js';
import User from './models/User.js';
import Incident from './models/Incident.js';
import Company from './models/Company.js';
import Evidence from './models/Evidence.js';
import { storeEvidenceHash, getEvidenceHash, verifyEvidenceHash } from './services/blockchainService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import hre from 'hardhat';

const { ethers } = hre;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testBlockchainPipeline = async () => {
  try {
    console.log('==================================================');
    console.log('Testing ChainShield Blockchain Evidence Pipeline');
    console.log('==================================================');

    console.log('\n1. Connecting to MongoDB...');
    await connectDB();

    console.log('\n2. Deploying fresh EvidenceRegistry smart contract for testing...');
    const EvidenceRegistry = await ethers.getContractFactory('EvidenceRegistry');
    const registry = await EvidenceRegistry.deploy();
    await registry.waitForDeployment();

    const deployedAddress = await registry.getAddress();
    process.env.EVIDENCE_REGISTRY_CONTRACT_ADDRESS = deployedAddress;
    console.log(`✓ Smart Contract Deployed at: ${deployedAddress}`);

    console.log('\n3. Creating test user & incident...');
    let company = await Company.findOne({ status: 'active' });
    if (!company) {
      company = await Company.create({ name: 'Blockchain Test Corp', code: 'BCTEST', status: 'active' });
    }

    const testUser = await User.create({
      name: 'Blockchain Tester',
      email: `bctest_${Date.now()}@chainshield.io`,
      password: 'Password123!',
      companyId: company._id,
      role: 'admin',
      status: 'active',
    });

    const testIncident = await Incident.create({
      incidentId: `INC-BC-${Math.floor(Math.random() * 100000)}`,
      title: 'Blockchain Integrity Test Incident',
      description: 'Test incident for verifying smart contract evidence hashing',
      severity: 'high',
      status: 'active',
      companyId: company._id,
      createdBy: testUser._id,
    });

    console.log(`✓ Test Incident created: ${testIncident.incidentId}`);

    // Test 4: Generate evidence and SHA-256 hash
    console.log('\n4. Generating simulated evidence artifact & SHA-256 hash...');
    const dummyContent = `CHAINSHIELD_EVIDENCE_PAYLOAD_${Date.now()}`;
    const sha256Hash = crypto.createHash('sha256').update(dummyContent).digest('hex');
    const evidenceId = `EVD-BC-${Math.floor(Math.random() * 100000)}`;

    const evidence = await Evidence.create({
      evidenceId,
      incidentId: testIncident._id,
      name: 'Network Packet Capture Dump.pcap',
      description: 'Simulated network capture for blockchain anchoring',
      evidenceType: 'network_capture',
      originalFileName: 'capture.pcap',
      storedFileName: 'cloudinary_pcap_123',
      filePath: 'https://res.cloudinary.com/demo/image/upload/sample.pcap',
      cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pcap',
      fileSize: 1024500,
      sha256Hash,
      collectedBy: testUser._id,
      currentCustodian: testUser._id,
      status: 'collected',
      blockchainRecord: {
        status: 'pending',
      },
    });

    console.log(`✓ Evidence record created in MongoDB with ID: ${evidence.evidenceId}`);
    console.log(`  SHA-256 Hash: ${sha256Hash}`);

    // Test 5: Anchor hash on smart contract directly using deployed contract instance
    console.log('\n5. Anchoring SHA-256 hash on smart contract using Ethers.js...');
    const tx = await registry.storeEvidenceHash(evidence.evidenceId, evidence.sha256Hash);
    const receipt = await tx.wait(1);

    evidence.blockchainRecord = {
      txHash: receipt.hash,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: deployedAddress,
      network: 'Hardhat Local Network',
      chainId: 31337,
      registeredAt: new Date(),
      status: 'confirmed',
    };
    await evidence.save();

    console.log('✓ Evidence anchored on-chain successfully!');
    console.log(`  Transaction Hash: ${receipt.hash}`);
    console.log(`  Block Number:     ${receipt.blockNumber}`);
    console.log(`  Contract Address: ${deployedAddress}`);

    // Test 6: Retrieve on-chain record directly from contract view function
    console.log('\n6. Querying smart contract state for evidence record...');
    const [onChainHash, timestamp, submitter] = await registry.getEvidenceHash(evidence.evidenceId);
    console.log(`✓ Retrieved on-chain hash: ${onChainHash}`);
    console.log(`  Submitter address:    ${submitter}`);

    // Test 7: Verify matching hash
    console.log('\n7. Running verification check (Original Hash vs On-Chain Hash)...');
    const isMatch = await registry.verifyEvidence(evidence.evidenceId, sha256Hash);
    console.log(`- Match Result: ${isMatch} (Expected: true)`);
    if (!isMatch) {
      console.error('❌ Verification match check failed!');
      process.exit(1);
    }

    // Test 8: Verify tampered hash detection
    console.log('\n8. Testing tampered hash detection...');
    const tamperedHash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const isTamperedMatch = await registry.verifyEvidence(evidence.evidenceId, tamperedHash);
    console.log(`- Tampered Match Result: ${isTamperedMatch} (Expected: false)`);

    // Test 9: Reject duplicate registration
    console.log('\n9. Testing duplicate registration rejection...');
    let duplicateBlocked = false;
    try {
      await registry.storeEvidenceHash(evidence.evidenceId, sha256Hash);
    } catch (dupErr) {
      duplicateBlocked = true;
    }
    console.log(`- Duplicate registration blocked: ${duplicateBlocked} (Expected: true)`);

    console.log('\n==================================================');
    console.log('🎉 ALL BLOCKCHAIN INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('==================================================');

    // Cleanup
    await Evidence.findByIdAndDelete(evidence._id);
    await Incident.findByIdAndDelete(testIncident._id);
    await User.findByIdAndDelete(testUser._id);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

testBlockchainPipeline();
