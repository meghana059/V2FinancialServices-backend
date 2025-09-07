import express from 'express';
import { login, getProfile, requestPasswordReset, resetPassword, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateLogin, validateRequestPasswordReset, validatePasswordReset } from '../middleware/validation';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/request-password-reset', validateRequestPasswordReset, requestPasswordReset);
router.post('/reset-password', validatePasswordReset, resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
