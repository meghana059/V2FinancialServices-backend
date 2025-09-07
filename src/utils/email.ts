import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
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
