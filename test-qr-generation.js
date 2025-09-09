const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
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

async function testQRGeneration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'engmeghana@gmail.com' });
    
    if (!user || !user.twoFactorSecret) {
      console.log('❌ User or 2FA secret not found');
      return;
    }

    console.log('🔍 Testing QR Code Generation for:', user.email);
    console.log('Database secret preview:', user.twoFactorSecret.substring(0, 8) + '...');
    console.log('Full secret length:', user.twoFactorSecret.length);
    
    // Generate QR code URL exactly like the system does
    const otpauthUrl = speakeasy.otpauthURL({
      secret: user.twoFactorSecret,
      label: user.email,
      issuer: 'V2 Financial Services',
      algorithm: 'sha1',
      digits: 6,
      period: 30
    });
    
    console.log('\n📱 Generated QR Code URL:');
    console.log(otpauthUrl);
    
    // Extract the secret from the URL
    const urlParams = new URLSearchParams(otpauthUrl.split('?')[1]);
    const qrSecret = urlParams.get('secret');
    
    console.log('\n🔍 Secret from QR URL:');
    console.log('QR secret preview:', qrSecret ? qrSecret.substring(0, 8) + '...' : 'None');
    console.log('QR secret length:', qrSecret ? qrSecret.length : 0);
    
    // Compare secrets
    console.log('\n🔍 Secret Comparison:');
    console.log('Database secret:', user.twoFactorSecret);
    console.log('QR URL secret:', qrSecret);
    console.log('Secrets match:', user.twoFactorSecret === qrSecret);
    
    // Generate current token with database secret
    const dbToken = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
    
    // Generate current token with QR secret
    const qrToken = speakeasy.totp({
      secret: qrSecret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
    
    console.log('\n🔢 Token Generation:');
    console.log('Token from database secret:', dbToken);
    console.log('Token from QR secret:', qrToken);
    console.log('Tokens match:', dbToken === qrToken);
    
    // Generate and save QR code
    await QRCode.toFile('test-qr-code.png', otpauthUrl);
    console.log('\n✅ Test QR code saved as test-qr-code.png');
    
    console.log('\n📋 Instructions:');
    console.log('1. Scan test-qr-code.png with Google Authenticator');
    console.log('2. The token should be:', dbToken);
    console.log('3. If the token is different, there might be an encoding issue');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testQRGeneration();
