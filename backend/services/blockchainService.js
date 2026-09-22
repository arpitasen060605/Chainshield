import { ethers } from 'ethers';

const EVIDENCE_REGISTRY_ABI = [
  "function storeEvidenceHash(string calldata evidenceId, string calldata sha256Hash) external",
  "function getEvidenceHash(string calldata evidenceId) external view returns (string memory sha256Hash, uint256 timestamp, address submitter)",
  "function verifyEvidence(string calldata evidenceId, string calldata sha256Hash) external view returns (bool)",
  "event EvidenceHashStored(string indexed evidenceId, string sha256Hash, uint256 timestamp, address indexed submitter)"
];

// Fallback Hardhat local dev private key (never used in production)
const LOCAL_DEV_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const getNetworkDetails = () => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  const rawAddress =
    process.env.EVIDENCE_REGISTRY_CONTRACT_ADDRESS ||
    process.env.CHAINSHIELD_CONTRACT_ADDRESS ||
    '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  let contractAddress;
  try {
    contractAddress = ethers.getAddress(rawAddress.trim());
  } catch {
    contractAddress = rawAddress.trim();
  }

  const networkName = process.env.BLOCKCHAIN_NETWORK || 'Ethereum Sepolia Testnet (ChainID: 11155111)';
  const chainId = parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '31337', 10);

  return { rpcUrl, contractAddress, networkName, chainId };
};

const getProviderAndSigner = () => {
  const { rpcUrl } = getNetworkDetails();
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || LOCAL_DEV_PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);

  return { provider, signer: wallet };
};

/**
 * Anchor evidence SHA-256 hash on smart contract
 * @param {string} evidenceId - Unique human readable evidence ID (e.g. EVD-000001)
 * @param {string} sha256Hash - 64-char SHA-256 digest
 * @returns {Promise<Object>} Blockchain transaction details or failure object
 */
export const storeEvidenceHash = async (evidenceId, sha256Hash) => {
  try {
    if (!evidenceId || !sha256Hash) {
      throw new Error('Evidence ID and SHA-256 hash are required for blockchain anchoring');
    }

    const { contractAddress, networkName, chainId } = getNetworkDetails();
    const { signer } = getProviderAndSigner();

    const contract = new ethers.Contract(contractAddress, EVIDENCE_REGISTRY_ABI, signer);

    // Call storeEvidenceHash on Solidity contract
    const tx = await contract.storeEvidenceHash(String(evidenceId).trim(), String(sha256Hash).trim());
    const receipt = await tx.wait(1); // Wait for 1 confirmation block

    const timestamp = new Date();
    const proofData = {
      evidenceId: String(evidenceId),
      sha256Hash: String(sha256Hash).toLowerCase(),
      contractAddress,
      network: networkName,
      chainId,
      transactionHash: receipt.hash,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      timestamp,
      registeredAt: timestamp,
      status: 'confirmed',
    };

    console.log(`[Blockchain Service] Hash anchored successfully on-chain! Tx: ${receipt.hash} | Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress,
      network: networkName,
      chainId,
      timestamp,
      blockchainRecord: proofData,
    };
  } catch (error) {
    console.error('[Blockchain Service Error] Failed to anchor hash on-chain:', error.message);
    const { contractAddress, networkName, chainId } = getNetworkDetails();
    return {
      success: false,
      status: 'failed',
      error: error.message,
      blockchainRecord: {
        network: networkName,
        chainId,
        contractAddress,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      },
    };
  }
};

/**
 * Retrieve evidence record from smart contract on-chain storage
 * @param {string} evidenceId
 * @returns {Promise<Object>} On-chain evidence proof record
 */
export const getEvidenceHash = async (evidenceId) => {
  try {
    const { contractAddress } = getNetworkDetails();
    const { provider } = getProviderAndSigner();

    const contract = new ethers.Contract(contractAddress, EVIDENCE_REGISTRY_ABI, provider);
    const [sha256Hash, timestampNum, submitter] = await contract.getEvidenceHash(String(evidenceId).trim());

    return {
      success: true,
      evidenceId: String(evidenceId),
      sha256Hash: String(sha256Hash).toLowerCase(),
      timestamp: new Date(Number(timestampNum) * 1000),
      submitter,
      contractAddress,
    };
  } catch (error) {
    console.error(`[Blockchain Service] getEvidenceHash failed for ${evidenceId}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify whether SHA-256 hash matches the on-chain smart contract record
 * @param {string} evidenceId
 * @param {string} sha256Hash
 * @returns {Promise<Object>} Verification result
 */
export const verifyEvidenceHash = async (evidenceId, sha256Hash) => {
  try {
    const { contractAddress, networkName, chainId } = getNetworkDetails();
    const { provider } = getProviderAndSigner();

    const contract = new ethers.Contract(contractAddress, EVIDENCE_REGISTRY_ABI, provider);

    // Call view function verifyEvidence
    const isMatch = await contract.verifyEvidence(String(evidenceId).trim(), String(sha256Hash).trim());
    const onChainResult = await getEvidenceHash(evidenceId);

    return {
      success: true,
      verified: Boolean(isMatch),
      isMatch: Boolean(isMatch),
      evidenceId: String(evidenceId),
      currentHash: String(sha256Hash).toLowerCase(),
      onChainHash: onChainResult.success ? onChainResult.sha256Hash : null,
      onChainTimestamp: onChainResult.success ? onChainResult.timestamp : null,
      submitter: onChainResult.success ? onChainResult.submitter : null,
      contractAddress,
      network: networkName,
      chainId,
    };
  } catch (error) {
    console.error(`[Blockchain Service] verifyEvidenceHash failed for ${evidenceId}:`, error.message);
    return {
      success: false,
      verified: false,
      error: error.message,
    };
  }
};

/**
 * Legacy compatibility helper for registerEvidenceOnChain
 */
export const registerEvidenceOnChain = async ({ evidenceId, sha256Hash, registeredBy }) => {
  return await storeEvidenceHash(evidenceId, sha256Hash);
};

/**
 * Legacy compatibility helper for verifyEvidenceOnChain
 */
export const verifyEvidenceOnChain = async ({ evidenceId, sha256Hash, blockchainRecord }) => {
  return await verifyEvidenceHash(evidenceId, sha256Hash);
};
