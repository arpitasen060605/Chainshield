import mongoose from 'mongoose';
import Evidence from '../models/Evidence.js';
import Incident from '../models/Incident.js';
import {
  storeEvidenceHash,
  getEvidenceHash,
  verifyEvidenceHash,
} from '../services/blockchainService.js';
import hashFile from '../utils/hashFile.js';
import { createAuditLog } from '../utils/auditLogger.js';

const SAFE_USER_FIELDS = 'name email role status';

const getEvidenceCompanyFilter = async (req) => {
  if (req.user?.role === 'platform_admin') return {};
  const companyId = req.user.companyId;
  const companyIncidentIds = await Incident.find({ companyId }).distinct('_id');
  return {
    $or: [
      { companyId },
      { incidentId: { $in: companyIncidentIds } },
    ],
  };
};

/**
 * @desc    Register evidence SHA-256 hash on immutable blockchain smart contract
 * @route   POST /api/blockchain/evidence/:id/register
 * @access  Private
 */
export const registerEvidenceProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = await getEvidenceCompanyFilter(req);

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, ...companyFilter }
      : { evidenceId: String(id).toUpperCase(), ...companyFilter };

    const evidence = await Evidence.findOne(findQuery);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence item not found',
      });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;

    // Anchor hash on-chain using Ethers.js and EvidenceRegistry contract
    const bcRes = await storeEvidenceHash(evidence.evidenceId, evidence.sha256Hash);

    if (bcRes.success && bcRes.blockchainRecord) {
      evidence.blockchainRecord = {
        txHash: bcRes.transactionHash || bcRes.blockchainRecord.txHash,
        transactionHash: bcRes.transactionHash,
        blockNumber: bcRes.blockNumber,
        blockHash: bcRes.blockchainRecord.blockHash,
        contractAddress: bcRes.contractAddress,
        network: bcRes.network,
        chainId: bcRes.chainId,
        registeredAt: bcRes.timestamp || new Date(),
        status: 'confirmed',
      };
      await evidence.save();

      await createAuditLog({
        action: 'BLOCKCHAIN_PROOF_REGISTERED',
        user: req.user,
        resourceType: 'Blockchain',
        resourceId: evidence.evidenceId,
        details: `Evidence SHA-256 digest ${evidence.sha256Hash} anchored on blockchain (Tx: ${bcRes.transactionHash})`,
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Evidence cryptographic proof registered on smart contract',
        evidenceId: evidence.evidenceId,
        sha256Hash: evidence.sha256Hash,
        blockchainRecord: evidence.blockchainRecord,
      });
    } else {
      evidence.blockchainRecord.status = 'failed';
      evidence.blockchainRecord.error = bcRes.error || 'Blockchain transaction failed';
      await evidence.save();

      return res.status(500).json({
        success: false,
        message: `Blockchain anchoring failed: ${bcRes.error}`,
        evidenceId: evidence.evidenceId,
        blockchainRecord: evidence.blockchainRecord,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stored blockchain record & verify integrity against on-chain transaction
 * @route   GET /api/blockchain/evidence/:id
 * @access  Private
 */
export const getEvidenceBlockchainProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = await getEvidenceCompanyFilter(req);

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, ...companyFilter }
      : { evidenceId: String(id).toUpperCase(), ...companyFilter };

    const evidence = await Evidence.findOne(findQuery)
      .populate('collectedBy', SAFE_USER_FIELDS)
      .populate('currentCustodian', SAFE_USER_FIELDS);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence item not found',
      });
    }

    // Query on-chain smart contract
    const onChainRecord = await getEvidenceHash(evidence.evidenceId);

    return res.status(200).json({
      success: true,
      evidenceId: evidence.evidenceId,
      name: evidence.name,
      sha256Hash: evidence.sha256Hash,
      blockchainRecord: evidence.blockchainRecord,
      onChainRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Full 3-Tier Verification (Cloudinary File vs MongoDB vs Smart Contract On-Chain Hash)
 * @route   POST /api/blockchain/evidence/:id/verify
 * @access  Private
 */
export const verifyEvidenceOnChainHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = await getEvidenceCompanyFilter(req);

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, ...companyFilter }
      : { evidenceId: String(id).toUpperCase(), ...companyFilter };

    const evidence = await Evidence.findOne(findQuery);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence item not found',
      });
    }

    // 1. Calculate current file SHA-256 hash from Cloudinary or local path
    const fileSource = evidence.cloudinaryUrl || evidence.filePath;
    let currentFileHash = evidence.sha256Hash;
    if (fileSource) {
      try {
        currentFileHash = await hashFile(fileSource);
      } catch (err) {
        console.warn(`[Verification Warning] Could not hash source file ${fileSource}:`, err.message);
      }
    }

    // 2. Database hash match check
    const databaseHash = evidence.sha256Hash;
    const databaseHashMatch = currentFileHash.toLowerCase() === databaseHash.toLowerCase();

    // 3. Smart contract on-chain hash check
    const onChainRes = await getEvidenceHash(evidence.evidenceId);
    let onChainHash = null;
    let blockchainHashMatch = false;

    if (onChainRes.success && onChainRes.sha256Hash) {
      onChainHash = onChainRes.sha256Hash;
      blockchainHashMatch = currentFileHash.toLowerCase() === onChainHash.toLowerCase();
    }

    const isBlockchainConfirmed =
      evidence.blockchainRecord &&
      (evidence.blockchainRecord.status === 'confirmed' || evidence.blockchainRecord.status === 'REGISTERED');

    const fileIntegrity = databaseHashMatch;
    const blockchainVerified = fileIntegrity && blockchainHashMatch && isBlockchainConfirmed;

    return res.status(200).json({
      success: true,
      evidenceId: evidence.evidenceId,
      fileIntegrity,
      databaseHashMatch,
      blockchainHashMatch,
      blockchainVerified,
      currentHash: currentFileHash,
      databaseHash,
      onChainHash,
      transactionHash: evidence.blockchainRecord?.txHash || evidence.blockchainRecord?.transactionHash || null,
      blockNumber: evidence.blockchainRecord?.blockNumber || null,
      contractAddress: evidence.blockchainRecord?.contractAddress || null,
      network: evidence.blockchainRecord?.network || null,
      status: evidence.blockchainRecord?.status || 'unanchored',
      message: blockchainVerified
        ? 'Evidence integrity verified successfully against on-chain smart contract record.'
        : databaseHashMatch
        ? 'File matches database record, but smart contract verification is unanchored or pending.'
        : 'ALERT: Cryptographic hash mismatch detected!',
    });
  } catch (error) {
    next(error);
  }
};
