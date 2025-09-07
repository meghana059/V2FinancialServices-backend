import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';

// Load environment variables
dotenv.config();

const clearDatabase = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    console.log('🗑️  Clearing all users from database...');
    
    // Delete all users
    const result = await User.deleteMany({});
    
    console.log(`✅ Deleted ${result.deletedCount} users from database`);
    console.log('🎉 Database cleared successfully');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

// Run clearing if this file is executed directly
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('🎉 Database clearing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database clearing failed:', error);
      process.exit(1);
    });
}

export default clearDatabase;
