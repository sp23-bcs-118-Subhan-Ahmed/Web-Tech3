import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bedentist.com' });
    
    if (existingAdmin) {
      // Update to make sure isAdmin is true
      await User.updateOne(
        { email: 'admin@bedentist.com' },
        { isAdmin: true, role: 'admin' }
      );
      console.log('Admin user already exists and updated!');
      console.log('Email: admin@bedentist.com');
      console.log('Password: admin123');
    } else {
      // Create admin user (password will be hashed by User model pre-save hook)
      const admin = await User.create({
        name: 'Super Admin',
        email: 'admin@bedentist.com',
        password: 'admin123', // Will be hashed automatically by model
        plainPassword: 'admin123', // Store plain password for super admin reference
        role: 'admin',
        isAdmin: true,
        isSuperAdmin: true // Mark as undeleteable super admin
      });

      console.log('\n Admin user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email: admin@bedentist.com');
      console.log('Password: admin123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    console.log('\n🔗 Login at: http://localhost:5000/login');
    console.log('👑 Admin Panel: http://localhost:5000/super-admin');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
