import express from 'express';
import { loginUser, registerUser, getMe, updatePassword, updateProfile, forgotPassword, verifyResetOtp, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login (Rate-limited to prevent brute-force attacks)
router.post('/login', authRateLimiter({ max: 20 }), loginUser);

// POST /api/auth/forgot-password (Rate-limited)
router.post('/forgot-password', authRateLimiter({ max: 10 }), forgotPassword);

// POST /api/auth/verify-reset-otp (Rate-limited)
router.post('/verify-reset-otp', authRateLimiter({ max: 15 }), verifyResetOtp);

// POST /api/auth/reset-password (Rate-limited)
router.post('/reset-password', authRateLimiter({ max: 10 }), resetPassword);

// GET /api/auth/me (Protected)
router.get('/me', protect, getMe);

// PUT /api/auth/profile (Protected)
router.put('/profile', protect, updateProfile);

// PUT /api/auth/update-password (Protected)
router.put('/update-password', protect, updatePassword);

export default router;



