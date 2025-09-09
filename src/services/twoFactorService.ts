import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { IUser } from '../types';

export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   */
  static generateSecret(user: IUser): string {
    return speakeasy.generateSecret({
      name: `V2 Financial Services (${user.email})`,
      issuer: 'V2 Financial Services',
      length: 32
    }).base32;
  }

  /**
   * Generate QR code URL for 2FA setup
   */
  static async generateQRCode(secret: string, user: IUser): Promise<string> {
    console.log('🔍 generateQRCode called with:', {
      secret: secret.substring(0, 20) + '...',
      secretLength: secret.length,
      userEmail: user.email
    });

    // Manual URL generation to ensure perfect synchronization
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent('V2 Financial Services')}&algorithm=SHA1&digits=6&period=30`;
    
    console.log('🔍 Generated QR URL:', otpauthUrl);
    
    // Verify the secret in the URL matches the input secret
    const urlParams = new URLSearchParams(otpauthUrl.split('?')[1]);
    const urlSecret = urlParams.get('secret');
    
    console.log('🔍 Secret verification:', {
      inputSecret: secret.substring(0, 20) + '...',
      urlSecret: urlSecret?.substring(0, 20) + '...',
      secretsMatch: secret === urlSecret
    });
    
    if (secret !== urlSecret) {
      console.error('❌ CRITICAL: Secret mismatch in QR generation!');
      throw new Error('Secret mismatch in QR code generation');
    }
    
    console.log('✅ QR code generation successful - secrets are synchronized');
    
    // Return the TOTP URI string instead of base64 data URL
    // The frontend QR code component will handle the QR generation
    return otpauthUrl;
  }

  /**
   * Verify a 2FA token with extended window for Google Authenticator
   */
  static verifyToken(secret: string, token: string): boolean {
    console.log('🔍 TwoFactorService.verifyToken called with:', {
      secretLength: secret.length,
      secretFirst20: secret.substring(0, 20) + '...',
      token: token,
      currentTime: new Date().toISOString()
    });

    const result = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 3 // Allow 3 time steps (90 seconds) of tolerance for Google Authenticator
    });

    console.log('🔍 TwoFactorService.verifyToken result:', result);

    // Additional debugging - generate current token for comparison
    const currentToken = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
    console.log('🔍 Current expected token:', currentToken);

    return result;
  }

  /**
   * Generate backup codes for 2FA
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(backupCodes: string[], code: string): boolean {
    const index = backupCodes.indexOf(code.toUpperCase());
    if (index !== -1) {
      // Remove used backup code
      backupCodes.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Generate a temporary token for 2FA verification during login
   */
  static generateTwoFactorToken(userId: string): string {
    const payload = {
      userId,
      type: '2fa',
      timestamp: Date.now()
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Verify and decode 2FA token
   */
  static verifyTwoFactorToken(token: string): { userId: string; valid: boolean } {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is not older than 15 minutes (extended for Google Authenticator)
      const isExpired = Date.now() - payload.timestamp > 15 * 60 * 1000;
      
      if (payload.type === '2fa' && !isExpired) {
        return { userId: payload.userId, valid: true };
      }
      
      return { userId: '', valid: false };
    } catch (error) {
      return { userId: '', valid: false };
    }
  }

  /**
   * Generate a test token for debugging purposes
   */
  static generateTestToken(secret: string): string {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
  }

  /**
   * Demonstrate window validation for debugging
   */
  static demonstrateWindowValidation(secret: string): void {
    const currentTime = Math.floor(Date.now() / 1000);
    const currentTimeSlot = Math.floor(currentTime / 30);
    
    console.log('\n🔍 TOTP Window Validation Demonstration:');
    console.log('=====================================');
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Current time slot: ${currentTimeSlot}`);
    console.log(`Secret length: ${secret.length}`);
    
    // Generate tokens for current and surrounding time slots
    for (let i = -2; i <= 2; i++) {
      const timeSlot = currentTimeSlot + i;
      const time = timeSlot * 30;
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        time: time
      });
      
      const isValid = this.verifyToken(secret, token);
      const status = isValid ? '✅ VALID' : '❌ INVALID';
      const timeLabel = i === 0 ? 'CURRENT' : i > 0 ? `+${i}` : `${i}`;
      
      console.log(`Time slot ${timeSlot} (${timeLabel}): ${token} - ${status}`);
    }
    
    console.log('=====================================\n');
  }
}
