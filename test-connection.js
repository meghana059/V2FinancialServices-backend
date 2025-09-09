const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    console.log('Ready State:', conn.connection.readyState);
    
    // Test a simple query
    const User = require('./dist/models/User').default;
    const userCount = await User.countDocuments();
    console.log('✅ Query test successful. User count:', userCount);
    
    // Keep connection alive for 10 seconds
    console.log('Keeping connection alive for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Final ready state:', mongoose.connection.readyState);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
};

testConnection();
