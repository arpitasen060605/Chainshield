import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT authentication on dashboard analytics endpoint
router.use(protect);

// GET /api/dashboard/stats & GET /api/dashboard
router.get('/stats', getDashboardStats);
router.get('/', getDashboardStats);

export default router;
