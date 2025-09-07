import express from 'express';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getDashboardStats
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validateUserCreation, validateUserUpdate } from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', authorize('admin'), validateUserCreation, createUser);
router.get('/', authorize('admin'), getAllUsers);
router.get('/stats', authorize('admin'), getDashboardStats);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), validateUserUpdate, updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
