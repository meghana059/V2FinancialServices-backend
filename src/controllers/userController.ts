import { Request, Response } from 'express';
import User from '../models/User';
import { IApiResponse, IUserInput } from '../types';
import { sendWelcomeEmail } from '../utils/email';
import { TwoFactorService } from '../services/twoFactorService';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Create user request body:', req.body);
    const { email, phoneNumber, password, fullName, role }: IUserInput = req.body;

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      } as IApiResponse);
      return;
    }

    // Check if user already exists by phone number
    const existingUserByPhone = await User.findOne({ phoneNumber });
    if (existingUserByPhone) {
      res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      } as IApiResponse);
      return;
    }

    // Generate password if not provided
    let finalPassword = password;
    if (!finalPassword) {
      // First 4 letters of name in caps
      const namePart = fullName.length >= 4 
        ? fullName.substring(0, 4).toUpperCase()
        : (fullName.toUpperCase() + 'V').substring(0, 4);
      
      // Last 4 digits of phone number
      const phonePart = phoneNumber.slice(-4);
      finalPassword = namePart + phonePart;
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      phoneNumber,
      password: finalPassword,
      fullName,
      role: role || 'user',
      createdBy: req.user?.email // Set the admin's email who created this user
    });

    // Generate 2FA setup for new user (mandatory for all users)
    const twoFactorSecret = TwoFactorService.generateSecret(user);
    const backupCodes = TwoFactorService.generateBackupCodes();
    
    // Set 2FA setup (mandatory for all users)
    user.twoFactorSecret = twoFactorSecret;
    user.twoFactorBackupCodes = backupCodes;
    
    await user.save();

    // Send welcome email to the new user
    try {
      await sendWelcomeEmail(
        user.email,
        user.fullName,
        finalPassword,
        user.role
      );
      console.log(`Welcome email sent successfully to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the user creation if email fails, just log the error
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: (user._id as any).toString(),
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        password: finalPassword // Return the password for display
      }
    } as IApiResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get all users first, then sort them
    const allUsers = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    // Sort users with admins first
    const sortedUsers = allUsers.sort((a, b) => {
      if (a.role === 'admin' && b.role === 'user') return -1;
      if (a.role === 'user' && b.role === 'admin') return 1;
      return 0; // Keep original order for same roles
    });

    // Apply pagination
    const users = sortedUsers.slice(skip, skip + limit);

    const total = await User.countDocuments({});

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    } as IApiResponse);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as IApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    } as IApiResponse);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, role, isActive } = req.body;
    
    console.log('Update user request:', { id, fullName, email, phoneNumber, role, isActive });

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as IApiResponse);
      return;
    }

    // Update fields
    console.log('Before update - User data:', {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive
    });

    if (fullName) {
      console.log('Updating fullName from', user.fullName, 'to', fullName);
      user.fullName = fullName;
    }
    if (email) {
      console.log('Updating email from', user.email, 'to', email.toLowerCase());
      user.email = email.toLowerCase();
    }
    if (phoneNumber) {
      console.log('Updating phoneNumber from', user.phoneNumber, 'to', phoneNumber);
      user.phoneNumber = phoneNumber;
    }
    if (role) {
      console.log('Updating role from', user.role, 'to', role);
      user.role = role;
    }
    if (typeof isActive === 'boolean') {
      console.log('Updating isActive from', user.isActive, 'to', isActive);
      user.isActive = isActive;
    }

    console.log('After update - User data:', {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive
    });

    await user.save();
    console.log('User saved successfully');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: (user._id as any).toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    } as IApiResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user && (req.user._id as any).toString() === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      } as IApiResponse);
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as IApiResponse);
      return;
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    } as IApiResponse);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Count users by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        adminCount,
        userCount,
        // Placeholders for future data
        portfolioValue: null,
        monthlyGrowth: null
      }
    } as IApiResponse);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};