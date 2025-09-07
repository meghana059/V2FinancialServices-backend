import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { sendPasswordResetEmail } from '../utils/email';
import { IAuthResponse, IApiResponse } from '../types';

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
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

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    } as IAuthResponse);
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
        _id: user!._id,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        role: user!.role,
        createdAt: user!.createdAt
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
    const { token, password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      } as IApiResponse);
      return;
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    } as IApiResponse);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};
