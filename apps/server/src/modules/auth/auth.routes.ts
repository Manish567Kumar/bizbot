import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { otpRateLimiter } from '../../middleware/rateLimiter';
import * as authController from './auth.controller';

const router = Router();

// POST /api/v1/auth/send-otp
router.post('/send-otp', otpRateLimiter, authController.sendOtp);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', otpRateLimiter, authController.verifyOtp);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// GET /api/v1/auth/me  (protected)
router.get('/me', authenticate, authController.getMe);

export default router;
