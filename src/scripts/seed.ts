import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';

// Load environment variables
dotenv.config();

const seedAdmin = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER || '+1234567890';
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFullName = process.env.ADMIN_FULL_NAME || 'Admin User';

    if (!adminEmail || !adminPassword) {
      console.error('❌ Missing required environment variables for admin seeding');
      console.error('Required: ADMIN_EMAIL, ADMIN_PASSWORD');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', {
        email: existingAdmin.email,
        fullName: existingAdmin.fullName,
        role: existingAdmin.role
      });
      return;
    }

    // Create admin user
    const admin = new User({
      email: adminEmail.toLowerCase(),
      phoneNumber: adminPhoneNumber,
      password: adminPassword,
      fullName: adminFullName,
      role: 'admin'
    });

    await admin.save();

    console.log('✅ Admin user created successfully:', {
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      id: (admin._id as any).toString()
    });

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('🎉 Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedAdmin;