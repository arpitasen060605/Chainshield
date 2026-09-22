import express from 'express';
import {
  registerEvidenceProof,
  getEvidenceBlockchainProof,
  verifyEvidenceOnChainHandler,
} from '../controllers/blockchainController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT authentication on blockchain endpoints
router.use(protect);

// POST /api/blockchain/evidence/:id/register - Anchor evidence SHA-256 hash on blockchain
router.post('/evidence/:id/register', registerEvidenceProof);

// GET /api/blockchain/evidence/:id - Retrieve blockchain transaction proof
router.get('/evidence/:id', getEvidenceBlockchainProof);

// POST /api/blockchain/evidence/:id/verify - Verify evidence SHA-256 against on-chain transaction
router.post('/evidence/:id/verify', verifyEvidenceOnChainHandler);

export default router;
