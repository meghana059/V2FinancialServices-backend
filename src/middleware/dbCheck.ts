import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkDatabaseConnection = (req: Request, res: Response, next: NextFunction): void => {
  const readyState = mongoose.connection.readyState;
  
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (readyState === 0) {
    console.error('Database not connected. Ready state:', readyState);
    res.status(503).json({
      success: false,
      message: 'Database connection lost. Please try again.'
    });
    return;
  }
  
  if (readyState === 2) {
    console.log('Database is connecting...');
    // Wait a bit for connection to establish
    setTimeout(() => {
      if (mongoose.connection.readyState === 1) {
        next();
      } else {
        res.status(503).json({
          success: false,
          message: 'Database connection timeout. Please try again.'
        });
      }
    }, 2000);
    return;
  }
  
  next();
};
