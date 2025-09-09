import { Request, Response } from 'express';
import User from '../models/User';
import { TwoFactorService } from '../services/twoFactorService';
import { ITwoFactorSetupResponse, ITwoFactorVerifyInput } from '../types';
import { generateToken } from '../utils/jwt';

export class TwoFactorController {
  /**
   * Setup 2FA during login (uses twoFactorToken)
   */
  static async setupTwoFactorDuringLogin(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 setupTwoFactorDuringLogin called with body:', req.body);
      const { twoFactorToken } = req.body;
      
      if (!twoFactorToken) {
        console.log('❌ No twoFactorToken provided');
        res.status(400).json({
          success: false,
          message: 'Two-factor token is required'
        });
        return;
      }

      // Verify the twoFactorToken
      const tokenData = TwoFactorService.verifyTwoFactorToken(twoFactorToken);
      if (!tokenData.valid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired two-factor token'
        });
        return;
      }

      const user = await User.findById(tokenData.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // 2FA is mandatory for all users - always allow setup
      // Check if user already has a secret, if not generate new one
      let secret = user.twoFactorSecret;
      let backupCodes = user.twoFactorBackupCodes;
      
      if (!secret) {
        // Generate new secret only if user doesn't have one
        secret = TwoFactorService.generateSecret(user);
        backupCodes = TwoFactorService.generateBackupCodes();
        
        // Save secret and backup codes
        user.twoFactorSecret = secret;
        user.twoFactorBackupCodes = backupCodes;
        await user.save();
      }
      
      // Generate QR code using existing or new secret
      const qrCodeUrl = await TwoFactorService.generateQRCode(secret, user);

      res.status(200).json({
        success: true,
        message: secret === user.twoFactorSecret ? '2FA setup retrieved successfully' : '2FA setup initiated successfully',
        qrCodeUrl,
        secret,
        backupCodes
      } as ITwoFactorSetupResponse);
    } catch (error) {
      console.error('Error setting up 2FA during login:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Setup 2FA for a user (authenticated)
   */
  static async setupTwoFactor(req: Request, res: Response): Promise<void> {
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

      // 2FA is mandatory for all users - always allow setup
      // Check if user already has a secret, if not generate new one
      let secret = user.twoFactorSecret;
      let backupCodes = user.twoFactorBackupCodes;
      
      if (!secret) {
        // Generate new secret only if user doesn't have one
        secret = TwoFactorService.generateSecret(user);
        backupCodes = TwoFactorService.generateBackupCodes();
        
        // Save secret and backup codes
        user.twoFactorSecret = secret;
        user.twoFactorBackupCodes = backupCodes;
        await user.save();
      }
      
      // Generate QR code using existing or new secret
      const qrCodeUrl = await TwoFactorService.generateQRCode(secret, user);

      const response: ITwoFactorSetupResponse = {
        success: true,
        message: secret === user.twoFactorSecret ? 'Two-factor authentication setup retrieved. Please scan the QR code and verify with a token.' : 'Two-factor authentication setup initiated. Please scan the QR code and verify with a token.',
        qrCodeUrl,
        secret,
        backupCodes
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify 2FA token and enable 2FA
   */
  static async verifyAndEnableTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { token } = req.body as ITwoFactorVerifyInput;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required'
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

      if (!user.twoFactorSecret) {
        res.status(400).json({
          success: false,
          message: 'Two-factor authentication setup not initiated'
        });
        return;
      }

      // 2FA is mandatory - always allow setup

      // Verify the token
      const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, token);
      
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid token. Please try again.'
        });
        return;
      }

      // 2FA is now set up (mandatory for all users)
      user.twoFactorSetupCompleted = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Two-factor authentication enabled successfully'
      });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Disable 2FA for a user
   */
  // 2FA is mandatory - disable method removed

  /**
   * Verify 2FA token during login
   */
  static async verifyTwoFactorLogin(req: Request, res: Response): Promise<void> {
    try {
      const { token, twoFactorToken } = req.body as ITwoFactorVerifyInput;
      
      console.log('🔍 verifyTwoFactorLogin called with:', { token, twoFactorToken: twoFactorToken?.substring(0, 20) + '...' });
      
      if (!token || !twoFactorToken) {
        console.log('❌ Missing token or twoFactorToken');
        res.status(400).json({
          success: false,
          message: 'Token and two-factor token are required'
        });
        return;
      }

      // Verify 2FA token
      const { userId, valid } = TwoFactorService.verifyTwoFactorToken(twoFactorToken);
      
      if (!valid) {
        console.log('❌ Invalid twoFactorToken');
        res.status(400).json({
          success: false,
          message: 'Invalid or expired two-factor token'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user || !user.twoFactorSecret) {
        console.log('❌ User not found or no 2FA secret');
        res.status(400).json({
          success: false,
          message: 'Two-factor authentication not properly configured'
        });
        return;
      }

      console.log('🔍 User found:', { email: user.email, secretLength: user.twoFactorSecret.length });
      console.log('🔍 Database secret (first 20 chars):', user.twoFactorSecret.substring(0, 20) + '...');
      console.log('🔍 Input token:', token);

      // Generate current expected token for comparison
      const currentExpectedToken = TwoFactorService.generateTestToken(user.twoFactorSecret);
      console.log('🔍 Current expected token:', currentExpectedToken);

      // Verify the 2FA token
      const isValidToken = TwoFactorService.verifyToken(user.twoFactorSecret, token);
      console.log('🔍 Token verification result:', isValidToken);
      
      if (!isValidToken) {
        console.log('🔍 Token invalid, checking backup codes...');
        // Check backup codes
        if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
          console.log('🔍 Available backup codes:', user.twoFactorBackupCodes.length);
          const isBackupCode = TwoFactorService.verifyBackupCode(user.twoFactorBackupCodes, token);
          console.log('🔍 Backup code verification result:', isBackupCode);
          if (isBackupCode) {
            console.log('✅ Backup code verified successfully');
            // Save the updated backup codes
            await user.save();
          } else {
            console.log('❌ Both token and backup code verification failed');
            console.log('🔍 Debug info:', {
              inputToken: token,
              expectedToken: currentExpectedToken,
              secretLength: user.twoFactorSecret.length,
              backupCodesCount: user.twoFactorBackupCodes?.length || 0
            });
            res.status(400).json({
              success: false,
              message: 'Invalid token or backup code'
            });
            return;
          }
        } else {
          console.log('❌ No backup codes available');
          res.status(400).json({
            success: false,
            message: 'Invalid token'
          });
          return;
        }
      } else {
        console.log('✅ Token verified successfully');
      }

      // Mark 2FA setup as completed if not already
      if (!user.twoFactorSetupCompleted) {
        user.twoFactorSetupCompleted = true;
        await user.save();
      }

      // Generate final JWT token
      const jwtToken = generateToken({
        userId: (user._id as any).toString(),
        email: user.email,
        role: user.role
      });

      // Set JWT in HTTP-only cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      };

      res.cookie('token', jwtToken, cookieOptions);

      res.status(200).json({
        success: true,
        message: 'Two-factor authentication verified successfully',
        user: {
          _id: (user._id as any).toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error verifying 2FA login:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get 2FA status for a user
   */
  static async getTwoFactorStatus(req: Request, res: Response): Promise<void> {
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

      res.status(200).json({
        success: true,
        data: {
          enabled: !!user.twoFactorSecret, // 2FA is enabled if secret exists
          hasSecret: !!user.twoFactorSecret, // Has 2FA secret
          hasBackupCodes: user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0,
          setupCompleted: !!user.twoFactorSetupCompleted, // Has completed 2FA setup
          needsSetup: !user.twoFactorSecret, // Needs initial setup
          canVerify: !!user.twoFactorSecret // Can verify (has secret)
        }
      });
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(req: Request, res: Response): Promise<void> {
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

      // 2FA is mandatory - always allow backup code regeneration

      // Generate new backup codes
      const backupCodes = TwoFactorService.generateBackupCodes();
      user.twoFactorBackupCodes = backupCodes;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Backup codes regenerated successfully',
        data: {
          backupCodes
        }
      });
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Debug endpoint to test 2FA token generation (development only)
   */
  static async debugTwoFactor(req: Request, res: Response): Promise<void> {
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
      if (!user || !user.twoFactorSecret) {
        res.status(404).json({
          success: false,
          message: 'User not found or 2FA not configured'
        });
        return;
      }

      // Generate a test token
      const testToken = TwoFactorService.generateTestToken(user.twoFactorSecret);
      
      // Demonstrate window validation
      TwoFactorService.demonstrateWindowValidation(user.twoFactorSecret);
      
      res.status(200).json({
        success: true,
        message: 'Debug information generated',
        data: {
          currentTime: new Date().toISOString(),
          serverTime: Math.floor(Date.now() / 1000),
          currentTimeSlot: Math.floor(Date.now() / 1000 / 30),
          testToken,
          secretLength: user.twoFactorSecret.length,
          twoFactorEnabled: !!user.twoFactorSecret, // 2FA is enabled if secret exists
          windowInfo: {
            windowSize: 5,
            totalTimeSlots: 11,
            totalDuration: '330 seconds (5.5 minutes)',
            explanation: 'Tokens are valid for 5 time slots before and after current time'
          }
        }
      });
    } catch (error) {
      console.error('Error in debug 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
