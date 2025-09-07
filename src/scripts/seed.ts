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
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFirstName = process.env.ADMIN_FIRST_NAME;
    const adminLastName = process.env.ADMIN_LAST_NAME;

    if (!adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      console.error('❌ Missing required environment variables for admin seeding');
      console.error('Required: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', {
        email: existingAdmin.email,
        firstName: existingAdmin.firstName,
        lastName: existingAdmin.lastName,
        role: existingAdmin.role
      });
      return;
    }

    // Create admin user
    const admin = new User({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'admin'
    });

    await admin.save();

    console.log('✅ Admin user created successfully:', {
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      id: admin._id
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