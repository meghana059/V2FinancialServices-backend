import nodemailer from 'nodemailer';

const createTransporter = () => {
  // Use Gmail with working credentials
  console.log('Using Gmail SMTP for email sending');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'engmeghana@gmail.com',
      pass: 'bcqrnqpghfesdtou',
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: 'engmeghana@gmail.com',
    to: email,
    subject: 'V2 Financial Group - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2C3E50; margin-bottom: 10px;">V2 Financial Group</h1>
          <div style="width: 100px; height: 3px; background-color: #D4AF37; margin: 0 auto;"></div>
        </div>
        
        <h2 style="color: #2C3E50; margin-bottom: 20px;">Password Reset Request</h2>
        
        <p style="color: #34495E; line-height: 1.6; margin-bottom: 20px;">
          You have requested to reset your password for your V2 Financial Group account.
        </p>
        
        <p style="color: #34495E; line-height: 1.6; margin-bottom: 30px;">
          Click the button below to reset your password. This link will expire in 15 minutes.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #7F8C8D; font-size: 14px; line-height: 1.6;">
          If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
        
        <p style="color: #7F8C8D; font-size: 14px; line-height: 1.6;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        <p style="color: #D4AF37; font-size: 14px; word-break: break-all;">
          ${resetUrl}
        </p>
        
        <hr style="border: none; border-top: 1px solid #ECF0F1; margin: 30px 0;">
        
        <p style="color: #7F8C8D; font-size: 12px; text-align: center;">
          © 2025 V2 Financial Group. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendPasswordUpdateNotificationToAdmin = async (
  adminEmail: string, 
  userEmail: string, 
  userName: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: 'engmeghana@gmail.com',
    to: adminEmail,
    subject: 'V2 Financial Group - User Password Updated',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2C3E50; margin-bottom: 10px;">V2 Financial Group</h1>
          <div style="width: 100px; height: 3px; background-color: #D4AF37; margin: 0 auto;"></div>
        </div>
        
        <h2 style="color: #2C3E50; margin-bottom: 20px;">User Password Update Notification</h2>
        
        <p style="color: #34495E; line-height: 1.6; margin-bottom: 20px;">
          This is to inform you that a user you created has successfully updated their password.
        </p>
        
        <div style="background-color: #F8F9FA; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0;">
          <h3 style="color: #2C3E50; margin: 0 0 10px 0;">User Details:</h3>
          <p style="margin: 5px 0; color: #34495E;"><strong>Name:</strong> ${userName}</p>
          <p style="margin: 5px 0; color: #34495E;"><strong>Email:</strong> ${userEmail}</p>
          <p style="margin: 5px 0; color: #34495E;"><strong>Password Updated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p style="color: #34495E; line-height: 1.6; margin-bottom: 20px;">
          The user has successfully reset their password using the forgot password functionality. 
          No further action is required from your end.
        </p>
        
        <div style="background-color: #E8F5E8; border: 1px solid #C3E6C3; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #2D5A2D; margin: 0; font-weight: bold;">
            ✅ Password update completed successfully
          </p>
        </div>
        
        <p style="color: #7F8C8D; font-size: 14px; line-height: 1.6;">
          This is an automated notification. If you have any concerns about this password update, 
          please contact the system administrator.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ECF0F1; margin: 30px 0;">
        
        <p style="color: #7F8C8D; font-size: 12px; text-align: center;">
          © 2025 V2 Financial Group. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password update notification sent to admin: ${adminEmail}`);
  } catch (error) {
    console.error('Error sending password update notification to admin:', error);
    throw new Error('Failed to send password update notification to admin');
  }
};

export const sendWelcomeEmail = async (
  email: string,
  fullName: string,
  password: string,
  role: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  
  const mailOptions = {
    from: 'engmeghana@gmail.com',
    to: email,
    subject: 'Welcome to V2 Financial Group - Your Account is Ready!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2C3E50; margin-bottom: 10px;">V2 Financial Group</h1>
          <div style="width: 100px; height: 3px; background-color: #D4AF37; margin: 0 auto;"></div>
        </div>
        
        <h2 style="color: #2C3E50; margin-bottom: 20px;">Welcome to V2 Financial Group!</h2>
        
        <p style="color: #34495E; line-height: 1.6; margin-bottom: 20px;">
          Hello <strong>${fullName}</strong>,
        </p>
        
        <p style="color: #34495E; line-height: 1.6; margin-bottom: 20px;">
          Welcome to V2 Financial Group! Your account has been successfully created and you can now access our platform.
        </p>
        
        <div style="background-color: #F8F9FA; border-left: 4px solid #D4AF37; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #2C3E50; margin: 0 0 15px 0;">Your Login Credentials:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #E0E0E0;">
            <p style="margin: 8px 0; color: #34495E;"><strong>Email:</strong> <span style="color: #D4AF37; font-weight: bold;">${email}</span></p>
            <p style="margin: 8px 0; color: #34495E;"><strong>Password Pattern:</strong></p>
            <div style="background-color: #F5F5F5; padding: 10px; border-radius: 5px; margin: 8px 0; border-left: 3px solid #D4AF37;">
              <p style="margin: 0; color: #2C3E50; font-weight: bold;">First 4 letters of your name in CAPS + Last 4 digits of your phone number</p>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background-color: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            Login to Your Account
          </a>
        </div>
        
        <div style="background-color: #FFF3CD; border: 1px solid #FFEAA7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #856404; margin: 0 0 15px 0;">🔐 IMPORTANT: Two-Factor Authentication Required</h4>
          <p style="color: #856404; margin: 0 0 15px 0; font-weight: bold;">
            For your security, you MUST set up Two-Factor Authentication (2FA) on your first login.
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h5 style="color: #2C3E50; margin: 0 0 10px 0;">📱 Step 1: Download an Authenticator App</h5>
            <p style="color: #34495E; margin: 0 0 10px 0; font-size: 14px;">
              Download one of these apps on your phone before logging in:
            </p>
            <ul style="color: #34495E; margin: 0; padding-left: 20px; font-size: 14px;">
              <li><strong>Google Authenticator:</strong> <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" style="color: #D4AF37;">Android</a> | <a href="https://apps.apple.com/app/google-authenticator/id388497605" style="color: #D4AF37;">iOS</a></li>
              <li><strong>Microsoft Authenticator:</strong> <a href="https://play.google.com/store/apps/details?id=com.azure.authenticator" style="color: #D4AF37;">Android</a> | <a href="https://apps.apple.com/app/microsoft-authenticator/id983156458" style="color: #D4AF37;">iOS</a></li>
              <li><strong>Authy:</strong> <a href="https://play.google.com/store/apps/details?id=com.authy.authy" style="color: #D4AF37;">Android</a> | <a href="https://apps.apple.com/app/authy/id494168017" style="color: #D4AF37;">iOS</a></li>
            </ul>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h5 style="color: #2C3E50; margin: 0 0 10px 0;">🔑 Step 2: Login and Set Up 2FA</h5>
            <p style="color: #34495E; margin: 0 0 10px 0; font-size: 14px;">
              When you login for the first time, you'll be prompted to set up 2FA:
            </p>
            <ol style="color: #34495E; margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Scan the QR code with your authenticator app</li>
              <li>Enter the 6-digit code to verify setup</li>
              <li>Save the backup codes provided</li>
              <li>Complete the setup process</li>
            </ol>
          </div>
          
          <div style="background-color: #F8D7DA; border: 1px solid #F5C6CB; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <p style="color: #721C24; margin: 0; font-size: 14px; font-weight: bold;">
              ⚠️ Pro Tip: If you don't have an authenticator app ready, you can still login and we'll guide you through the setup process!
            </p>
          </div>
        </div>
        
        <div style="background-color: #E8F5E8; border: 1px solid #C3E6C3; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #2D5A2D; margin: 0 0 10px 0;">🔐 Additional Security Recommendations:</h4>
          <ul style="color: #2D5A2D; margin: 0; padding-left: 20px;">
            <li>Change your password after your first login</li>
            <li>Use a strong, unique password</li>
            <li>Never share your login credentials</li>
            <li>Log out when using shared computers</li>
            <li>Keep your backup codes in a safe place</li>
          </ul>
        </div>
        
        <p style="color: #34495E; line-height: 1.6; margin-bottom: 20px;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ECF0F1; margin: 30px 0;">
        
        <p style="color: #7F8C8D; font-size: 12px; text-align: center;">
          © 2025 V2 Financial Group. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};