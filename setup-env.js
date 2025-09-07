const fs = require('fs');
const path = require('path');

const envContent = `# Database
MONGODB_URI=mongodb+srv://meghana:Meghu%40059@demo.sbqnlrf.mongodb.net/?retryWrites=true&w=majority&appName=Demo

# JWT
JWT_SECRET=TheSecretOfV2FinancialGroupIs8088640167
JWT_EXPIRE=1d

# Email Configuration (for password reset)
EMAIL_HOST=engmeghana@gmail.com
#EMAIL_PORT=587
#EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-bcqrnqpghfesdtou
EMAIL_FROM=engmeghana@gmail.com

# Server
PORT=5000
NODE_ENV=development

# Initial Admin Credentials
ADMIN_EMAIL=admin001@v2financialgroup.com
ADMIN_PHONE_NUMBER=+1234567890
ADMIN_PASSWORD=Admin@123456
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:5173`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully with admin phone number!');
  console.log('📱 Admin phone number set to: +1234567890');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
