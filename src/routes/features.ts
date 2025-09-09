import express from 'express';
import { getUserWorkflows } from '../controllers/featureController';
import { updateInvoiceWorkflow } from '../controllers/workflowController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user workflows based on role
router.get('/user/workflows', getUserWorkflows);

// Admin-only route to update invoice workflow
router.post('/admin/update-invoice-workflow', authorize('admin'), updateInvoiceWorkflow);

export default router;
