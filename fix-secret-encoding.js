const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
require('dotenv').config();

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  twoFactorSecret: String,
  twoFactorBackupCodes: [String],
  twoFactorSetupCompleted: Boolean,
  role: String,
  fullName: String,
  _id: mongoose.Schema.Types.ObjectId
});

const User = mongoose.model('User', userSchema);

async function fixSecretEncoding() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'engmeghana@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('🔍 Current secret in database:');
    console.log('Secret:', user.twoFactorSecret);
    console.log('Length:', user.twoFactorSecret ? user.twoFactorSecret.length : 0);
    
    // Generate a new, properly formatted secret
    const newSecret = speakeasy.generateSecret({
      name: `V2 Financial Services (${user.email})`,
      issuer: 'V2 Financial Services',
      length: 32
    }).base32;
    
    console.log('\n🔧 New properly formatted secret:');
    console.log('Secret:', newSecret);
    console.log('Length:', newSecret.length);
    
    // Update the user with the new secret
    user.twoFactorSecret = newSecret;
    await user.save();
    
    console.log('\n✅ Updated user with new secret');
    
    // Test token generation with new secret
    const testToken = speakeasy.totp({
      secret: newSecret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
    
    console.log('\n🔢 Test token with new secret:', testToken);
    
    // Generate QR code URL
    const otpauthUrl = speakeasy.otpauthURL({
      secret: newSecret,
      label: user.email,
      issuer: 'V2 Financial Services',
      algorithm: 'sha1',
      digits: 6,
      period: 30
    });
    
    console.log('\n📱 New QR Code URL:');
    console.log(otpauthUrl);
    
    // Extract secret from URL to verify
    const urlParams = new URLSearchParams(otpauthUrl.split('?')[1]);
    const qrSecret = urlParams.get('secret');
    
    console.log('\n🔍 Verification:');
    console.log('Database secret:', newSecret);
    console.log('QR URL secret:', qrSecret);
    console.log('Secrets match:', newSecret === qrSecret);
    
    if (newSecret === qrSecret) {
      console.log('\n🎉 SUCCESS: Secret encoding is now correct!');
      console.log('📱 Instructions:');
      console.log('1. Delete the old entry from Google Authenticator');
      console.log('2. Scan the new QR code (I\'ll generate it next)');
      console.log('3. Use token:', testToken, 'to test');
    } else {
      console.log('\n❌ ERROR: Secret encoding is still wrong');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixSecretEncoding();
