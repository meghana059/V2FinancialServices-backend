const mongoose = require('mongoose');
const QRCode = require('qrcode');
require('dotenv').config();

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  twoFactorSecret: String,
  twoFactorEnabled: Boolean,
  twoFactorBackupCodes: [String]
});

const User = mongoose.model('User', userSchema);

async function generateAdminQR() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    if (!admin.twoFactorSecret) {
      console.log('❌ Admin does not have 2FA secret');
      return;
    }
    
    console.log('✅ Admin found:', {
      email: admin.email,
      hasSecret: !!admin.twoFactorSecret,
      secretPreview: admin.twoFactorSecret.substring(0, 8) + '...'
    });
    
    // Generate QR code
    const otpauthUrl = `otpauth://totp/V2%20Financial%20Services%20(${encodeURIComponent(admin.email)})?secret=${admin.twoFactorSecret}&issuer=V2%20Financial%20Services`;
    
    // Save as file
    await QRCode.toFile('admin-2fa-qr.png', otpauthUrl);
    console.log('✅ QR code saved as admin-2fa-qr.png');
    
    // Also generate data URL
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
    console.log('📱 QR Code Data URL:', qrCodeDataURL);
    
    console.log('\n🔐 Admin 2FA Setup:');
    console.log('Secret:', admin.twoFactorSecret);
    console.log('Backup Codes:', admin.twoFactorBackupCodes);
    console.log('\n📱 Scan the QR code with Google Authenticator or Microsoft Authenticator');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

generateAdminQR();
