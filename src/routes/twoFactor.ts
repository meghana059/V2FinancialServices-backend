import express from 'express';
import { TwoFactorController } from '../controllers/twoFactorController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Test route (no auth required)
router.post('/test-no-auth', (req, res) => {
  res.json({ success: true, message: 'No auth required route works', body: req.body });
});

// All 2FA routes require authentication (setup and verify are handled directly in server.ts)
router.use(authenticate);

// Setup 2FA (authenticated users)
router.post('/setup-authenticated', TwoFactorController.setupTwoFactor);

// Verify and enable 2FA (authenticated users)
router.post('/verify-authenticated', TwoFactorController.verifyAndEnableTwoFactor);

// 2FA is mandatory - disable route removed

// Get 2FA status
router.get('/status', TwoFactorController.getTwoFactorStatus);

// Regenerate backup codes
router.post('/regenerate-backup-codes', TwoFactorController.regenerateBackupCodes);

// Debug endpoint (development only)
router.get('/debug', TwoFactorController.debugTwoFactor);

export default router;
