import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

/**
 * Middleware to check if user has 2FA enabled and is properly authenticated
 */
export const requireTwoFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // If 2FA is enabled (has secret), check if user has completed 2FA verification
    if (user.twoFactorSecret) {
      const twoFactorVerified = (req as any).user?.twoFactorVerified;
      
      if (!twoFactorVerified) {
        res.status(403).json({
          success: false,
          message: 'Two-factor authentication verification required',
          requiresTwoFactor: true
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('2FA middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user has 2FA enabled (for informational purposes)
 */
export const checkTwoFactorStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Add 2FA status to request object
    (req as any).twoFactorEnabled = !!user.twoFactorSecret;
    (req as any).twoFactorSetup = !!user.twoFactorSecret;

    next();
  } catch (error) {
    console.error('2FA status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
