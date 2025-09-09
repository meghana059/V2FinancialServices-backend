import { Request, Response } from 'express';
import { IApiResponse, IInvoiceJobResponse, IInvoiceTemplateResponse } from '../types';
import InvoiceTemplate from '../models/InvoiceTemplate';
import InvoiceJob from '../models/InvoiceJob';
import { InvoiceService } from '../services/invoiceService';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Get all invoice templates
export const getInvoiceTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await InvoiceTemplate.find()
      .select('name description fileName isDefault createdAt')
      .sort({ isDefault: -1, createdAt: -1 });

    const response: IApiResponse<IInvoiceTemplateResponse[]> = {
      success: true,
      message: 'Templates retrieved successfully',
      data: templates.map(template => ({
        _id: (template._id as any).toString(),
        name: template.name,
        description: template.description,
        fileName: template.fileName,
        isDefault: template.isDefault,
        createdAt: template.createdAt.toISOString()
      }))
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to retrieve templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Upload new template
export const uploadTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const file = req.file;

    if (!file) {
      const response: IApiResponse = {
        success: false,
        message: 'Template file is required'
      };
      res.status(400).json(response);
      return;
    }

    if (!name) {
      const response: IApiResponse = {
        success: false,
        message: 'Template name is required'
      };
      res.status(400).json(response);
      return;
    }

    // Check if template with same name exists
    const existingTemplate = await InvoiceTemplate.findOne({ name });
    if (existingTemplate) {
      const response: IApiResponse = {
        success: false,
        message: 'Template with this name already exists'
      };
      res.status(400).json(response);
      return;
    }

    // Create template record
    const template = new InvoiceTemplate({
      name,
      description,
      filePath: file.path,
      fileName: file.originalname,
      isDefault: false,
      createdBy: req.user?._id
    });

    await template.save();

    const response: IApiResponse<IInvoiceTemplateResponse> = {
      success: true,
      message: 'Template uploaded successfully',
      data: {
        _id: (template._id as any).toString(),
        name: template.name,
        description: template.description,
        fileName: template.fileName,
        isDefault: template.isDefault,
        createdAt: template.createdAt.toISOString()
      }
    };

    res.status(201).json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to upload template',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Delete template
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await InvoiceTemplate.findById(id);
    if (!template) {
      const response: IApiResponse = {
        success: false,
        message: 'Template not found'
      };
      res.status(404).json(response);
      return;
    }

    if (template.isDefault) {
      const response: IApiResponse = {
        success: false,
        message: 'Cannot delete default template'
      };
      res.status(400).json(response);
      return;
    }

    // Delete file from filesystem
    if (fs.existsSync(template.filePath)) {
      fs.unlinkSync(template.filePath);
    }

    await InvoiceTemplate.findByIdAndDelete(id);

    const response: IApiResponse = {
      success: true,
      message: 'Template deleted successfully'
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to delete template',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Validate Excel file
export const validateExcelFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      const response: IApiResponse = {
        success: false,
        message: 'Excel file is required'
      };
      res.status(400).json(response);
      return;
    }

    const validation = InvoiceService.validateExcelFile(file.path);
    
    if (!validation.isValid) {
      const response: IApiResponse = {
        success: false,
        message: validation.error || 'Invalid Excel file'
      };
      res.status(400).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Excel file validated successfully',
      data: {
        rowCount: validation.data?.length || 0,
        validEntities: validation.data?.filter(d => d.entityPath && d.entityPath.trim() !== '').length || 0
      }
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to validate Excel file',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Generate invoices
export const generateInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId, invoiceYear } = req.body;
    const file = req.file;

    if (!file) {
      const response: IApiResponse = {
        success: false,
        message: 'Excel file is required'
      };
      res.status(400).json(response);
      return;
    }

    if (!templateId || !invoiceYear) {
      const response: IApiResponse = {
        success: false,
        message: 'Template ID and invoice year are required'
      };
      res.status(400).json(response);
      return;
    }

    // Validate template exists
    const template = await InvoiceTemplate.findById(templateId);
    if (!template) {
      const response: IApiResponse = {
        success: false,
        message: 'Template not found'
      };
      res.status(404).json(response);
      return;
    }

    // Validate Excel file
    const validation = InvoiceService.validateExcelFile(file.path);
    if (!validation.isValid) {
      const response: IApiResponse = {
        success: false,
        message: validation.error || 'Invalid Excel file'
      };
      res.status(400).json(response);
      return;
    }

    // Create job record
    const jobId = uuidv4();
    const outputDir = path.join(process.cwd(), 'uploads', 'invoices', `${invoiceYear}-invoices-${jobId}`);
    
    const job = new InvoiceJob({
      jobId,
      status: 'pending',
      createdBy: req.user?._id,
      templateId: template._id,
      inputFileName: file.originalname,
      inputFilePath: file.path,
      invoiceYear,
      totalEntities: validation.data?.length || 0,
      outputDirectory: outputDir
    });

    await job.save();

    // Start background processing (in a real app, you'd use a job queue like Bull)
    processInvoiceGeneration(job, template, validation.data!, invoiceYear, outputDir);

    const response: IApiResponse<IInvoiceJobResponse> = {
      success: true,
      message: 'Invoice generation started',
      data: {
        jobId: job.jobId,
        status: job.status,
        message: 'Invoice generation is processing in the background'
      }
    };

    res.status(202).json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to start invoice generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Get job status
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await InvoiceJob.findOne({ jobId })
      .populate('templateId', 'name')
      .populate('createdBy', 'fullName email');

    if (!job) {
      const response: IApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Job status retrieved successfully',
      data: {
        jobId: job.jobId,
        status: job.status,
        templateName: (job.templateId as any)?.name,
        inputFileName: job.inputFileName,
        invoiceYear: job.invoiceYear,
        totalEntities: job.totalEntities,
        processedEntities: job.processedEntities,
        progress: job.totalEntities > 0 ? (job.processedEntities / job.totalEntities) * 100 : 0,
        generatedFiles: job.generatedFiles,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt
      }
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to get job status',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Get all jobs
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const jobs = await InvoiceJob.find()
      .populate('templateId', 'name')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InvoiceJob.countDocuments();

    const response: IApiResponse = {
      success: true,
      message: 'Jobs retrieved successfully',
      data: {
        jobs: jobs.map(job => ({
          jobId: job.jobId,
          status: job.status,
          templateName: (job.templateId as any)?.name,
          inputFileName: job.inputFileName,
          invoiceYear: job.invoiceYear,
          totalEntities: job.totalEntities,
          processedEntities: job.processedEntities,
          progress: job.totalEntities > 0 ? (job.processedEntities / job.totalEntities) * 100 : 0,
          createdAt: job.createdAt,
          completedAt: job.completedAt
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalJobs: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to get jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Cancel job
export const cancelJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await InvoiceJob.findOne({ jobId });
    if (!job) {
      const response: IApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      const response: IApiResponse = {
        success: false,
        message: `Cannot cancel job with status: ${job.status}`
      };
      res.status(400).json(response);
      return;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    job.errorMessage = 'Job cancelled by admin';
    await job.save();

    const response: IApiResponse = {
      success: true,
      message: 'Job cancelled successfully'
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to cancel job',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Pause job
export const pauseJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await InvoiceJob.findOne({ jobId });
    if (!job) {
      const response: IApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    if (job.status !== 'processing') {
      const response: IApiResponse = {
        success: false,
        message: `Cannot pause job with status: ${job.status}`
      };
      res.status(400).json(response);
      return;
    }

    job.status = 'paused';
    await job.save();

    const response: IApiResponse = {
      success: true,
      message: 'Job paused successfully'
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to pause job',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Resume job
export const resumeJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await InvoiceJob.findOne({ jobId });
    if (!job) {
      const response: IApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    if (job.status !== 'paused') {
      const response: IApiResponse = {
        success: false,
        message: `Cannot resume job with status: ${job.status}`
      };
      res.status(400).json(response);
      return;
    }

    job.status = 'processing';
    await job.save();

    // Restart the background processing
    const template = await InvoiceTemplate.findById(job.templateId);
    if (template) {
      // Re-read the Excel file and continue processing
      const validation = InvoiceService.validateExcelFile(job.inputFilePath);
      if (validation.isValid && validation.data) {
        processInvoiceGeneration(job, template, validation.data, job.invoiceYear, job.outputDirectory);
      } else {
        job.status = 'failed';
        job.errorMessage = 'Failed to re-validate Excel file during resume';
        job.completedAt = new Date();
        await job.save();
      }
    } else {
      job.status = 'failed';
      job.errorMessage = 'Template not found during resume';
      job.completedAt = new Date();
      await job.save();
    }

    const response: IApiResponse = {
      success: true,
      message: 'Job resumed successfully'
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to resume job',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Mark stuck jobs as failed
export const markStuckJobsAsFailed = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find jobs that have been processing for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const stuckJobs = await InvoiceJob.find({
      status: 'processing',
      startedAt: { $lt: thirtyMinutesAgo }
    });

    let updatedCount = 0;
    for (const job of stuckJobs) {
      job.status = 'failed';
      job.errorMessage = 'Job marked as failed due to timeout (stuck for more than 30 minutes)';
      job.completedAt = new Date();
      await job.save();
      updatedCount++;
    }

    const response: IApiResponse = {
      success: true,
      message: `Marked ${updatedCount} stuck jobs as failed`,
      data: { updatedCount }
    };

    res.json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to mark stuck jobs as failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Download generated files
export const downloadFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await InvoiceJob.findOne({ jobId });
    if (!job) {
      const response: IApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    if (job.status !== 'completed') {
      const response: IApiResponse = {
        success: false,
        message: 'Job is not completed yet'
      };
      res.status(400).json(response);
      return;
    }

    // Create zip file with all generated files
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`invoices-${job.invoiceYear}-${jobId}.zip`);
    archive.pipe(res);

    // Add all generated files to zip
    for (const filePath of job.generatedFiles) {
      if (fs.existsSync(filePath)) {
        const fileName = path.basename(filePath);
        archive.file(filePath, { name: fileName });
      }
    }

    await archive.finalize();
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to download files',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};

// Background processing function
async function processInvoiceGeneration(
  job: any,
  template: any,
  invoiceData: any[],
  invoiceYear: string,
  outputDir: string
): Promise<void> {
  try {
    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();

    const generatedFiles = await InvoiceService.generateInvoices(
      invoiceData,
      template,
      invoiceYear,
      outputDir,
      job
    );

    job.status = 'completed';
    job.completedAt = new Date();
    job.generatedFiles = generatedFiles;
    await job.save();

    console.log(`Invoice generation completed for job ${job.jobId}`);
  } catch (error) {
    job.status = 'failed';
    job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    await job.save();

    console.error(`Invoice generation failed for job ${job.jobId}:`, error);
  }
}
