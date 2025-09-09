import express from 'express';
import { login, getProfile, requestPasswordReset, resetPassword, logout } from '../controllers/authController';
import { TwoFactorController } from '../controllers/twoFactorController';
import { authenticate } from '../middleware/auth';
import { validateLogin, validateRequestPasswordReset, validatePasswordReset } from '../middleware/validation';
import { checkDatabaseConnection } from '../middleware/dbCheck';

const router = express.Router();

// Public routes
router.post('/login', checkDatabaseConnection, validateLogin, login);
router.post('/verify-2fa', checkDatabaseConnection, TwoFactorController.verifyTwoFactorLogin);
router.post('/request-password-reset', checkDatabaseConnection, validateRequestPasswordReset, requestPasswordReset);
router.post('/reset-password', checkDatabaseConnection, validatePasswordReset, resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
