import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Evidence from '../models/Evidence.js';
import Incident from '../models/Incident.js';
import hashFile from '../utils/hashFile.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { registerEvidenceOnChain, storeEvidenceHash } from '../services/blockchainService.js';
import { uploadToCloudinary, uploadBufferToCloudinary } from '../config/cloudinary.js';

const SAFE_USER_FIELDS = 'name email role status';
const SAFE_INCIDENT_FIELDS = 'incidentId title severity status';

const ALLOWED_EVIDENCE_TYPES = [
  'document',
  'image',
  'video',
  'audio',
  'log',
  'memory_dump',
  'disk_image',
  'network_capture',
  'other',
];

const ALLOWED_STATUSES = [
  'collected',
  'under_investigation',
  'verified',
  'archived',
];

/**
 * Check if a user is authorized to access a given incident case
 */
const canUserAccessIncident = (user, incident) => {
  if (!user || !incident) return false;
  if (incident.companyId && String(incident.companyId) !== String(user.companyId)) return false;
  const userRole = (user.role || '').toLowerCase();
  const userIdStr = (user._id || user.id).toString();

  // Admins and Lead Investigators can access all incidents
  if (['admin', 'company_admin', 'lead_investigator', 'forensic_analyst', 'auditor'].includes(userRole)) {
    return true;
  }

  // Incident Responders can access incidents they created or are assigned to
  if (userRole === 'incident_responder') {
    const isCreator = incident.createdBy?._id
      ? incident.createdBy._id.toString() === userIdStr
      : incident.createdBy?.toString() === userIdStr;

    const isAssigned =
      Array.isArray(incident.assignedTo) &&
      incident.assignedTo.some((u) => {
        const uId = u._id ? u._id.toString() : u.toString();
        return uId === userIdStr;
      });

    return isCreator || isAssigned;
  }

  return false;
};

/**
 * Safely generate a unique human-readable Evidence ID (e.g. EVD-000001)
 */
const generateUniqueEvidenceId = async () => {
  const count = await Evidence.countDocuments();
  let evidenceId = `EVD-${String(count + 1).padStart(6, '0')}`;
  let exists = await Evidence.findOne({ evidenceId });
  let attempts = 1;

  while (exists) {
    evidenceId = `EVD-${String(count + 1 + attempts).padStart(6, '0')}`;
    exists = await Evidence.findOne({ evidenceId });
    attempts++;
  }

  return evidenceId;
};

/**
 * @desc    Upload & ingest a new digital evidence artifact
 * @route   POST /api/evidence
 * @access  Private
 */
export const createEvidence = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach an evidence file to upload',
      });
    }

    const { incidentId, name, description, evidenceType, status } = req.body;

    if (!incidentId) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Please provide parent incident ID for this evidence',
      });
    }

    // Verify parent incident exists
    const findIncidentQuery = mongoose.Types.ObjectId.isValid(incidentId)
      ? { _id: incidentId }
      : { incidentId: String(incidentId).toUpperCase() };

    const parentIncident = await Incident.findOne(findIncidentQuery);

    if (!parentIncident) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Parent incident case not found',
      });
    }

    // Verify user authorization for target incident case
    if (!canUserAccessIncident(req.user, parentIncident)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to attach evidence to this incident case',
      });
    }

    // Calculate authoritative SHA-256 hash from buffer or disk file
    let sha256Hash;
    try {
      if (req.file.buffer) {
        sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      } else {
        sha256Hash = await hashFile(req.file.path);
      }
    } catch (hashErr) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: `Failed to compute cryptographic SHA-256 hash: ${hashErr.message}`,
      });
    }

    const evidenceId = await generateUniqueEvidenceId();
    const userId = req.user._id || req.user.id;

    // Normalize type & status
    const normType = evidenceType ? String(evidenceType).toLowerCase().trim() : 'other';
    const normStatus = status ? String(status).toLowerCase().trim() : 'collected';

    // Upload directly from memory buffer (or disk fallback) to Cloudinary
    let cloudinaryResult;
    try {
      if (req.file.buffer) {
        cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
      } else {
        cloudinaryResult = await uploadToCloudinary(req.file.path);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    } catch (cloudErr) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: `Failed to upload evidence file to Cloudinary: ${cloudErr.message}`,
      });
    }

    const evidence = new Evidence({
      evidenceId,
      incidentId: parentIncident._id,
      name: name ? name.trim() : req.file.originalname,
      description: description ? description.trim() : '',
      evidenceType: ALLOWED_EVIDENCE_TYPES.includes(normType) ? normType : 'other',
      originalFileName: req.file.originalname,
      storedFileName: cloudinaryResult.public_id || req.file.filename,
      filePath: cloudinaryResult.secure_url,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype || 'application/octet-stream',
      sha256Hash,
      collectedBy: userId,
      currentCustodian: userId,
      status: ALLOWED_STATUSES.includes(normStatus) ? normStatus : 'collected',
      custodyHistory: [
        {
          previousCustodian: null,
          newCustodian: userId,
          performedBy: userId,
          action: 'collection',
          timestamp: new Date(),
          notes: 'Initial evidence collection and custody registration',
        },
      ],
    });

    await evidence.save();

    // Automatically anchor evidence SHA-256 digest on smart contract
    try {
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
      } else {
        evidence.blockchainRecord.status = 'failed';
        evidence.blockchainRecord.error = bcRes.error || 'Blockchain anchoring failed';
      }
      await evidence.save();
    } catch (bcError) {
      console.error('[Evidence Controller Warning] Blockchain anchoring error:', bcError.message);
      evidence.blockchainRecord.status = 'failed';
      evidence.blockchainRecord.error = bcError.message;
      await evidence.save();
    }

    await createAuditLog({
      action: 'EVIDENCE_UPLOADED',
      user: req.user,
      resourceType: 'Evidence',
      resourceId: evidence.evidenceId,
      details: `Evidence "${evidence.name}" (${evidence.evidenceType}) uploaded with SHA-256 hash ${evidence.sha256Hash}`,
      req,
    });

    const populatedEvidence = await Evidence.findById(evidence._id)
      .populate('incidentId', SAFE_INCIDENT_FIELDS)
      .populate('collectedBy', SAFE_USER_FIELDS)
      .populate('currentCustodian', SAFE_USER_FIELDS)
      .select('-filePath'); // Omit internal server filesystem path from response

    return res.status(201).json({
      success: true,
      message: 'Evidence uploaded successfully',
      evidence: populatedEvidence,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * @desc    Get all evidence artifacts with filtering, search, and pagination
 * @route   GET /api/evidence
 * @access  Private
 */
export const getAllEvidence = async (req, res, next) => {
  try {
    const { incidentId, evidenceType, status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // 1. Parent Incident Filter
    if (incidentId && incidentId !== 'All') {
      if (mongoose.Types.ObjectId.isValid(incidentId)) {
        query.incidentId = incidentId;
      } else {
        const foundInc = await Incident.findOne({ incidentId: String(incidentId).toUpperCase() });
        if (foundInc) {
          query.incidentId = foundInc._id;
        } else {
          query.incidentId = null;
        }
      }
    }

    // 2. Evidence Type Filter
    if (evidenceType && evidenceType !== 'All') {
      const typeMap = {
        document: 'document',
        documents: 'document',
        image: 'image',
        images: 'image',
        screenshots: 'image',
        video: 'video',
        videos: 'video',
        audio: 'audio',
        log: 'log',
        logs: 'log',
        'log files': 'log',
        memory_dump: 'memory_dump',
        disk_image: 'disk_image',
        network_capture: 'network_capture',
        'network captures': 'network_capture',
        other: 'other',
      };
      const normType = typeMap[String(evidenceType).toLowerCase().trim()];
      if (normType) query.evidenceType = normType;
    }

    // 3. Status Filter
    if (status && status !== 'All') {
      const normStatus = String(status).toLowerCase().trim();
      if (ALLOWED_STATUSES.includes(normStatus)) {
        query.status = normStatus;
      }
    }

    // 4. Search Filter (across name, evidenceId, sha256Hash, originalFileName)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { evidenceId: { $regex: search, $options: 'i' } },
        { sha256Hash: { $regex: search, $options: 'i' } },
        { originalFileName: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const totalEvidence = await Evidence.countDocuments(query);
    const evidenceList = await Evidence.find(query)
      .populate('incidentId', SAFE_INCIDENT_FIELDS)
      .populate('collectedBy', SAFE_USER_FIELDS)
      .populate('currentCustodian', SAFE_USER_FIELDS)
      .select('-filePath') // Exclude internal server storage paths
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total: totalEvidence,
      totalPages: Math.ceil(totalEvidence / limitNum) || 1,
      count: evidenceList.length,
      evidence: evidenceList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single evidence details by ID or evidenceId
 * @route   GET /api/evidence/:id
 * @access  Private
 */
export const getEvidenceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { evidenceId: String(id).toUpperCase() };

    const evidence = await Evidence.findOne(findQuery)
      .populate('incidentId', SAFE_INCIDENT_FIELDS)
      .populate('collectedBy', SAFE_USER_FIELDS)
      .populate('currentCustodian', SAFE_USER_FIELDS)
      .select('-filePath'); // Omit internal path

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence artifact not found',
      });
    }

    return res.status(200).json({
      success: true,
      evidence,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download physical evidence file safely
 * @route   GET /api/evidence/:id/download
 * @access  Private
 */
export const downloadEvidenceFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { evidenceId: String(id).toUpperCase() };

    const evidence = await Evidence.findOne(findQuery).populate('incidentId');

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence artifact not found',
      });
    }

    // Verify user access to parent incident case
    if (evidence.incidentId && !canUserAccessIncident(req.user, evidence.incidentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to download evidence from this case',
      });
    }

    const fileUrl = evidence.cloudinaryUrl || (evidence.filePath?.startsWith('http') ? evidence.filePath : null);

    if (fileUrl) {
      const streamRemote = (urlStr, maxRedirects = 5) => {
        if (maxRedirects <= 0) {
          return res.status(500).json({
            success: false,
            message: 'Too many redirects while fetching remote evidence file',
          });
        }
        const client = urlStr.startsWith('https') ? https : http;
        client
          .get(urlStr, (remoteRes) => {
            if (remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
              return streamRemote(remoteRes.headers.location, maxRedirects - 1);
            }
            if (remoteRes.statusCode !== 200) {
              return res.status(remoteRes.statusCode).json({
                success: false,
                message: 'Failed to retrieve evidence file from Cloudinary vault',
              });
            }
            res.setHeader('Content-Type', evidence.mimeType || remoteRes.headers['content-type'] || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(evidence.originalFileName)}"`);
            if (remoteRes.headers['content-length']) {
              res.setHeader('Content-Length', remoteRes.headers['content-length']);
            }
            remoteRes.pipe(res);
          })
          .on('error', (err) => {
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: `Failed to download evidence file stream: ${err.message}`,
              });
            }
          });
      };

      return streamRemote(fileUrl);
    }

    // Fallback for legacy local disk files
    const resolvedPath = path.resolve(evidence.filePath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical evidence file missing from vault storage',
      });
    }

    return res.download(resolvedPath, evidence.originalFileName);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to ensure evidence has at least an initial custody event if missing
 */
const ensureInitialCustodyHistory = (evidence) => {
  if (!evidence.custodyHistory || evidence.custodyHistory.length === 0) {
    evidence.custodyHistory = [
      {
        previousCustodian: null,
        newCustodian: evidence.collectedBy?._id || evidence.collectedBy || evidence.currentCustodian?._id || evidence.currentCustodian,
        performedBy: evidence.collectedBy?._id || evidence.collectedBy || evidence.currentCustodian?._id || evidence.currentCustodian,
        action: 'collection',
        timestamp: evidence.acquisitionDate || evidence.createdAt || new Date(),
        notes: 'Initial evidence collection',
      },
    ];
  }
};

/**
 * @desc    Get Chain of Custody history for an evidence artifact
 * @route   GET /api/evidence/:id/custody
 * @access  Private
 */
export const getCustodyHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { evidenceId: String(id).toUpperCase() };

    const evidence = await Evidence.findOne(findQuery)
      .populate('collectedBy', SAFE_USER_FIELDS)
      .populate('currentCustodian', SAFE_USER_FIELDS)
      .populate('custodyHistory.previousCustodian', SAFE_USER_FIELDS)
      .populate('custodyHistory.newCustodian', SAFE_USER_FIELDS)
      .populate('custodyHistory.performedBy', SAFE_USER_FIELDS);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence artifact not found',
      });
    }

    if (!evidence.custodyHistory || evidence.custodyHistory.length === 0) {
      ensureInitialCustodyHistory(evidence);
      await evidence.save();
      await evidence.populate([
        { path: 'custodyHistory.previousCustodian', select: SAFE_USER_FIELDS },
        { path: 'custodyHistory.newCustodian', select: SAFE_USER_FIELDS },
        { path: 'custodyHistory.performedBy', select: SAFE_USER_FIELDS },
      ]);
    }

    return res.status(200).json({
      success: true,
      evidenceId: evidence.evidenceId,
      evidenceName: evidence.name,
      currentCustodian: evidence.currentCustodian,
      collectedBy: evidence.collectedBy,
      custodyHistory: evidence.custodyHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Transfer custody of an evidence artifact to a new custodian
 * @route   POST /api/evidence/:id/custody/transfer
 * @access  Private
 */
export const transferCustody = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newCustodian, newCustodianId, newCustodianEmail, notes, reason } = req.body;

    const targetUserIdentifier = newCustodian || newCustodianId || newCustodianEmail;

    if (!targetUserIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide target new custodian (User ID or email address)',
      });
    }

    // 1. Verify evidence artifact exists
    const findEvidenceQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { evidenceId: String(id).toUpperCase() };

    const evidence = await Evidence.findOne(findEvidenceQuery);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence artifact not found',
      });
    }

    // 2. Validate target new custodian exists and is active
    let targetUserQuery;
    if (mongoose.Types.ObjectId.isValid(targetUserIdentifier)) {
      targetUserQuery = { _id: targetUserIdentifier };
    } else {
      targetUserQuery = { email: String(targetUserIdentifier).toLowerCase().trim() };
    }

    const User = mongoose.model('User');
    const targetUser = await User.findOne(targetUserQuery);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target custodian user not found',
      });
    }

    if (targetUser.status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Target custodian user account is deactivated',
      });
    }

    const previousCustodianId = evidence.currentCustodian;
    const performingUserId = req.user._id || req.user.id;

    // Check if initial custody history exists; if not, initialize it
    ensureInitialCustodyHistory(evidence);

    // Append new custody event (system-generated timestamp & performedBy)
    const newCustodyEvent = {
      previousCustodian: previousCustodianId,
      newCustodian: targetUser._id,
      performedBy: performingUserId,
      action: 'transfer',
      timestamp: new Date(),
      notes: notes ? String(notes).trim() : (reason ? String(reason).trim() : 'Custody transferred'),
    };

    evidence.custodyHistory.push(newCustodyEvent);

    // Update current custodian
    evidence.currentCustodian = targetUser._id;

    // Save evidence (sha256Hash remains 100% untouched)
    await evidence.save();

    await createAuditLog({
      action: 'CUSTODY_TRANSFERRED',
      user: req.user,
      resourceType: 'Custody',
      resourceId: evidence.evidenceId,
      details: `Custody of evidence ${evidence.evidenceId} transferred to ${targetUser.name || targetUser.email}`,
      req,
    });

    // Populate for clean response
    const updatedEvidence = await Evidence.findById(evidence._id)
      .populate('collectedBy', SAFE_USER_FIELDS)
      .populate('currentCustodian', SAFE_USER_FIELDS)
      .populate('custodyHistory.previousCustodian', SAFE_USER_FIELDS)
      .populate('custodyHistory.newCustodian', SAFE_USER_FIELDS)
      .populate('custodyHistory.performedBy', SAFE_USER_FIELDS)
      .select('-filePath');

    return res.status(200).json({
      success: true,
      message: `Custody of evidence ${evidence.evidenceId} successfully transferred to ${targetUser.name || targetUser.email}`,
      currentCustodian: updatedEvidence.currentCustodian,
      custodyHistory: updatedEvidence.custodyHistory,
      evidence: updatedEvidence,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cryptographically verify evidence file integrity against baseline SHA-256 hash
 * @route   POST /api/evidence/:id/verify
 * @access  Private
 */
export const verifyEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { evidenceId: String(id).toUpperCase() };

    const evidence = await Evidence.findOne(findQuery);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence artifact not found',
      });
    }

    const fileSource = evidence.cloudinaryUrl || evidence.filePath;
    const isRemote = fileSource && /^https?:\/\//i.test(fileSource);

    if (!isRemote && (!fileSource || !fs.existsSync(fileSource))) {
      return res.status(404).json({
        success: false,
        message: 'Physical evidence file is missing from vault storage',
      });
    }

    // Calculate current stream-based SHA-256 hash of stored file
    let calculatedHash;
    try {
      calculatedHash = await hashFile(fileSource);
    } catch (hashErr) {
      return res.status(500).json({
        success: false,
        message: `Failed to calculate current SHA-256 hash: ${hashErr.message}`,
      });
    }

    // Compare calculated hash against original baseline sha256Hash
    const originalHash = evidence.sha256Hash;
    const isMatch = calculatedHash.toLowerCase() === originalHash.toLowerCase();
    const result = isMatch ? 'VERIFIED' : 'TAMPERED';

    const userId = req.user._id || req.user.id;

    // Append verification record (original baseline sha256Hash remains 100% UNCHANGED!)
    const verificationRecord = {
      originalHash,
      calculatedHash,
      result,
      verifiedBy: userId,
      timestamp: new Date(),
    };

    if (!evidence.verificationHistory) {
      evidence.verificationHistory = [];
    }

    evidence.verificationHistory.push(verificationRecord);
    await evidence.save();

    await createAuditLog({
      action: 'EVIDENCE_VERIFIED',
      user: req.user,
      resourceType: 'Verification',
      resourceId: evidence.evidenceId,
      details: `Evidence ${evidence.evidenceId} verified with result: ${result}`,
      req,
    });

    // Populate for clean response
    await evidence.populate({
      path: 'verificationHistory.verifiedBy',
      select: SAFE_USER_FIELDS,
    });

    const latestVerification = evidence.verificationHistory[evidence.verificationHistory.length - 1];

    return res.status(200).json({
      success: true,
      message: isMatch
        ? 'Evidence integrity verified successfully (VERIFIED)'
        : 'ALERT: Evidence integrity mismatch detected (TAMPERED)',
      result,
      isMatch,
      originalHash,
      calculatedHash,
      evidenceId: evidence.evidenceId,
      verifiedBy: latestVerification ? latestVerification.verifiedBy : { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
      timestamp: latestVerification ? latestVerification.timestamp : new Date(),
      verificationHistory: evidence.verificationHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete verification history for an evidence artifact
 * @route   GET /api/evidence/:id/verifications
 * @access  Private
 */
export const getVerificationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { evidenceId: String(id).toUpperCase() };

    const evidence = await Evidence.findOne(findQuery)
      .populate('incidentId', SAFE_INCIDENT_FIELDS)
      .populate({
        path: 'verificationHistory.verifiedBy',
        select: SAFE_USER_FIELDS,
      });

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence artifact not found',
      });
    }

    const history = (evidence.verificationHistory || []).map((v) => ({
      _id: v._id,
      evidenceId: evidence.evidenceId,
      incidentId: evidence.incidentId?.incidentId || evidence.incidentId?._id || 'N/A',
      fileName: evidence.name || evidence.originalFileName,
      originalHash: v.originalHash || evidence.sha256Hash,
      calculatedHash: v.calculatedHash,
      result: v.result,
      hashStatus: v.result === 'VERIFIED' ? 'Match' : 'Mismatch',
      verifiedBy: v.verifiedBy,
      verifier: v.verifiedBy?.name || v.verifiedBy?.email || 'Investigator',
      timestamp: v.timestamp,
      verificationDate: v.timestamp ? new Date(v.timestamp).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
    }));

    return res.status(200).json({
      success: true,
      evidenceId: evidence.evidenceId,
      originalHash: evidence.sha256Hash,
      verificationHistory: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get verification history stream across all evidence artifacts
 * @route   GET /api/evidence/verifications
 * @access  Private
 */
export const getAllVerifications = async (req, res, next) => {
  try {
    const { result, search } = req.query;

    const evidences = await Evidence.find({
      'verificationHistory.0': { $exists: true },
    })
      .populate('incidentId', SAFE_INCIDENT_FIELDS)
      .populate({
        path: 'verificationHistory.verifiedBy',
        select: SAFE_USER_FIELDS,
      })
      .select('evidenceId name originalFileName sha256Hash verificationHistory incidentId');

    let allVerifications = [];

    evidences.forEach((ev) => {
      if (Array.isArray(ev.verificationHistory)) {
        ev.verificationHistory.forEach((v) => {
          allVerifications.push({
            _id: v._id,
            evidenceDbId: ev._id,
            evidenceId: ev.evidenceId,
            incidentId: ev.incidentId?.incidentId || ev.incidentId?._id || 'N/A',
            fileName: ev.name || ev.originalFileName,
            originalHash: v.originalHash || ev.sha256Hash,
            calculatedHash: v.calculatedHash,
            result: v.result,
            hashStatus: v.result === 'VERIFIED' ? 'Match' : 'Mismatch',
            verifiedBy: v.verifiedBy,
            verifier: v.verifiedBy?.name || v.verifiedBy?.email || 'Investigator',
            timestamp: v.timestamp,
            verificationDate: v.timestamp ? new Date(v.timestamp).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
          });
        });
      }
    });

    // Sort newest first
    allVerifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Optional result filtering
    if (result && result !== 'All') {
      const targetResult = String(result).toUpperCase();
      allVerifications = allVerifications.filter((v) => v.result === targetResult);
    }

    // Optional search filtering
    if (search && String(search).trim()) {
      const q = String(search).toLowerCase().trim();
      allVerifications = allVerifications.filter(
        (v) =>
          v.evidenceId.toLowerCase().includes(q) ||
          String(v.incidentId).toLowerCase().includes(q) ||
          v.fileName.toLowerCase().includes(q) ||
          v.verifier.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: allVerifications.length,
      verifications: allVerifications,
    });
  } catch (error) {
    next(error);
  }
};
