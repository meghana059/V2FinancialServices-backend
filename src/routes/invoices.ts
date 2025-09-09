import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  getInvoiceTemplates,
  uploadTemplate,
  deleteTemplate,
  validateExcelFile,
  generateInvoices,
  getJobStatus,
  getJobs,
  downloadFiles,
  cancelJob,
  pauseJob,
  resumeJob,
  markStuckJobsAsFailed
} from '../controllers/invoiceController';
import { authenticate, authorize } from '../middleware/auth';
import { checkDatabaseConnection } from '../middleware/dbCheck';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Allow Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.toLowerCase().endsWith('.xlsx') ||
        file.originalname.toLowerCase().endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes require authentication and admin role
router.use(checkDatabaseConnection);
router.use(authenticate);
router.use(authorize('admin'));

// Template management routes
router.get('/templates', getInvoiceTemplates);
router.post('/templates', upload.single('template'), uploadTemplate);
router.delete('/templates/:id', deleteTemplate);

// Invoice generation routes
router.post('/validate', upload.single('file'), validateExcelFile);
router.post('/generate', upload.single('file'), generateInvoices);

// Job management routes
router.get('/jobs', getJobs);
router.get('/jobs/:jobId', getJobStatus);
router.get('/jobs/:jobId/download', downloadFiles);
router.post('/jobs/:jobId/cancel', cancelJob);
router.post('/jobs/:jobId/pause', pauseJob);
router.post('/jobs/:jobId/resume', resumeJob);
router.post('/jobs/mark-stuck-as-failed', markStuckJobsAsFailed);

export default router;
