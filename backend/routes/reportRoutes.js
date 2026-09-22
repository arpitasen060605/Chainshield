import express from 'express';
import {
  generateReport,
  getAllReports,
  getReportById,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT authentication on all report management routes
router.use(protect);

// POST /api/reports/generate - Generate investigation report from live database records
router.post('/generate', generateReport);
router.post('/', generateReport);

// GET /api/reports - Get list of investigation reports
router.get('/', getAllReports);

// GET /api/reports/:id - Get detailed investigation report
router.get('/:id', getReportById);

export default router;
