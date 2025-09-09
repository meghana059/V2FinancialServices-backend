import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Handle connection events before connecting
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected - attempting to reconnect...');
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (mongoose.connection.readyState === 0) {
          mongoose.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
          }).catch(err => {
            console.error('Reconnection failed:', err);
          });
        }
      }, 5000);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      retryWrites: true,
      w: 'majority',
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit immediately, try to reconnect
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

export default connectDB;
