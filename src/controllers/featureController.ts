import { Request, Response } from 'express';
import { IApiResponse } from '../types';
import Workflow from '../models/Workflow';

export const getUserWorkflows = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role || 'user';
    
    // Build query based on user role
    let query: any = { isAvailable: true };
    
    if (userRole === 'admin') {
      // Admin can access all available workflows
      query = { isAvailable: true };
    } else {
      // Regular users can only access workflows accessible to 'user' or 'both'
      query = {
        isAvailable: true,
        $or: [
          { accessibleTo: 'user' },
          { accessibleTo: 'both' }
        ]
      };
    }

    const workflows = await Workflow.find(query).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: 'Workflows retrieved successfully',
      data: {
        workflows,
        userRole
      }
    } as IApiResponse);
  } catch (error) {
    console.error('Get user workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};
