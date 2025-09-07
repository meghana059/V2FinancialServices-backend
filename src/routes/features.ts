import express from 'express';
import { getUserWorkflows } from '../controllers/featureController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user workflows based on role
router.get('/user/workflows', getUserWorkflows);

export default router;
