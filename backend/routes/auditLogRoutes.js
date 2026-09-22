import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT authentication for audit log routes
router.use(protect);

// GET /api/audit-logs - Retrieve audit telemetry logs
router.get('/', getAuditLogs);

export default router;
