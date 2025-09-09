import { Request, Response } from 'express';
import { IApiResponse } from '../types';
import Workflow from '../models/Workflow';

export const updateInvoiceWorkflow = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find and update the invoice generation workflow
    const result = await Workflow.updateOne(
      { label: 'Invoice Generation' },
      { 
        frontendRoute: '/admin/invoice-generation',
        description: 'Generate performance fee invoices from Excel data'
      }
    );
    
    if (result.modifiedCount > 0) {
      const response: IApiResponse = {
        success: true,
        message: 'Invoice Generation workflow route updated successfully'
      };
      res.json(response);
    } else {
      // Verify if it's already correct
      const workflow = await Workflow.findOne({ label: 'Invoice Generation' });
      if (workflow && workflow.frontendRoute === '/admin/invoice-generation') {
        const response: IApiResponse = {
          success: true,
          message: 'Invoice Generation workflow route is already correct'
        };
        res.json(response);
      } else {
        const response: IApiResponse = {
          success: false,
          message: 'No Invoice Generation workflow found to update'
        };
        res.status(404).json(response);
      }
    }
    
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Failed to update workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
};
