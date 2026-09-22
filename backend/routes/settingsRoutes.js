import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT authentication on settings endpoints
router.use(protect);

// GET /api/settings - Retrieve current system settings
router.get('/', getSettings);

// PUT /api/settings - Update system settings
router.put('/', updateSettings);

export default router;
