import express from 'express';
import {
  getPlatformCompanies,
  getPlatformStats,
  getPendingCompanyAdmins,
  updateCompanyAdminStatus,
} from '../controllers/platformController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Enforce authentication & Platform Admin authorization for all platform routes
router.use(protect);
router.use(authorizeRoles('platform_admin'));

router.get('/companies', getPlatformCompanies);
router.get('/stats', getPlatformStats);
router.get('/pending-admins', getPendingCompanyAdmins);
router.put('/company-admins/:id/status', updateCompanyAdminStatus);

export default router;
