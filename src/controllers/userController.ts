import { Request, Response } from 'express';
import User from '../models/User';
import { IApiResponse, IUserInput } from '../types';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role }: IUserInput = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      } as IApiResponse);
      return;
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
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

    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    const { firstName, lastName, role, isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as IApiResponse);
      return;
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
    if (req.user?._id.toString() === id) {
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

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    } as IApiResponse);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as IApiResponse);
  }
};
