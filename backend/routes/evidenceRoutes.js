import express from 'express';
import {
  createEvidence,
  getAllEvidence,
  getEvidenceById,
  downloadEvidenceFile,
  getCustodyHistory,
  transferCustody,
  verifyEvidence,
  getVerificationHistory,
  getAllVerifications,
} from '../controllers/evidenceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadEvidenceFile } from '../middleware/uploadMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Enforce JWT authentication on all evidence management routes
router.use(protect);

// POST /api/evidence - Upload & ingest evidence file
router.post('/', authorizeRoles('company_admin','admin','incident_responder','lead_investigator','forensic_analyst'), uploadEvidenceFile, createEvidence);

// GET /api/evidence - Get all evidence artifacts (Filterable, Paginated)
router.get('/', getAllEvidence);

// GET /api/evidence/verifications - Get verification history across all evidence artifacts
router.get('/verifications', getAllVerifications);

// GET /api/evidence/:id - Get single evidence details by Mongo ID or evidenceId
router.get('/:id', getEvidenceById);

// GET /api/evidence/:id/download - Download evidence file
router.get('/:id/download', downloadEvidenceFile);

// GET /api/evidence/:id/custody - Get Chain of Custody history
router.get('/:id/custody', getCustodyHistory);

// POST /api/evidence/:id/custody/transfer - Transfer custody to a new custodian
router.post('/:id/custody/transfer', authorizeRoles('company_admin','admin','forensic_analyst','lead_investigator'), transferCustody);
router.post('/:id/custody', authorizeRoles('company_admin','admin','forensic_analyst','lead_investigator'), transferCustody);

// POST /api/evidence/:id/verify - Cryptographically verify evidence integrity
router.post('/:id/verify', authorizeRoles('company_admin','admin','forensic_analyst'), verifyEvidence);

// GET /api/evidence/:id/verifications - Get verification history for specific evidence
router.get('/:id/verifications', getVerificationHistory);
router.get('/:id/verify', getVerificationHistory);

export default router;
