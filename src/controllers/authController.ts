import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { sendPasswordResetEmail, sendPasswordUpdateNotificationToAdmin } from '../utils/email';
import { IAuthResponse, IApiResponse } from '../types';
import { TwoFactorService } from '../services/twoFactorService';
import { generateToken } from '../utils/jwt';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email with retry mechanism
    let user;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        user = await User.findOne({ email: email.toLowerCase() });
        break; // Success, exit retry loop
      } catch (dbError) {
        retries++;
        console.error(`Database error during login (attempt ${retries}):`, dbError);
        
        if (retries >= maxRetries) {
          res.status(503).json({
            success: false,
            message: 'Database connection issue. Please try again.'
          } as IAuthResponse);
          return;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      } as IAuthResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      } as IAuthResponse);
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      } as IAuthResponse);
      return;
    }

    // 2FA is MANDATORY for all users - always require it
    // Generate temporary 2FA token
    const twoFactorToken = TwoFactorService.generateTwoFactorToken((user._id as any).toString());
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication required',
      requiresTwoFactor: true,
      twoFactorToken
    } as IAuthResponse);
    return;
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IAuthResponse);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        _id: (user!._id as any).toString(),
        email: user!.email,
        fullName: user!.fullName,
        phoneNumber: user!.phoneNumber,
        role: user!.role,
        isActive: user!.isActive,
        createdAt: user!.createdAt,
        updatedAt: user!.updatedAt
      }
    } as IApiResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      } as IApiResponse);
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    } as IApiResponse);
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email, newPassword } = req.body;
    
    console.log('🔍 resetPassword called with:', {
      token: token?.substring(0, 20) + '...',
      email: email,
      newPasswordLength: newPassword?.length
    });

    // Find user by reset token and email
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    console.log('🔍 User lookup result:', {
      userFound: !!user,
      userEmail: user?.email,
      userResetToken: user?.resetPasswordToken?.substring(0, 20) + '...',
      userResetExpires: user?.resetPasswordExpires,
      currentTime: new Date()
    });

    if (!user) {
      console.log('❌ No user found with matching token and email');
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      } as IApiResponse);
      return;
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send notification to admin who created this user (if createdBy exists)
    if (user.createdBy) {
      try {
        await sendPasswordUpdateNotificationToAdmin(user.createdBy, user.email, user.fullName);
        console.log(`Admin notification sent for password update: ${user.email}`);
      } catch (error) {
        // Don't fail the password reset if admin notification fails
        console.error('Failed to send admin notification for password update:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    } as IApiResponse);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the JWT cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    } as IApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};
