# V2 Financial Group - Backend API

A secure, scalable backend API for V2 Financial Group built with Express, TypeScript, and MongoDB.

## Features

- **Role-Based Authentication**: Admin and User roles with JWT tokens
- **User Management**: Admin can create, update, and manage users
- **Password Reset**: Secure password reset with email links (15min expiry)
- **Database Seeding**: Automatic admin user creation on startup
- **Security**: bcrypt password hashing, rate limiting, CORS, helmet
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Nodemailer for email functionality
- Express Validator for input validation

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Email service (Gmail, SendGrid, etc.)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Update `.env` with your configuration:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/v2-financial

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@v2financialgroup.com

# Server
PORT=5000
NODE_ENV=development

# Initial Admin Credentials
ADMIN_EMAIL=admin@v2financialgroup.com
ADMIN_PASSWORD=Admin@123456
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users (Admin Only)
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Schema

### User Model
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  firstName: string (required)
  lastName: string (required)
  role: 'admin' | 'user' (default: 'user')
  isActive: boolean (default: true)
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  createdAt: Date
  updatedAt: Date
}
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: Express-validator for all inputs
- **Password Requirements**: Minimum 6 characters with complexity rules

## Database Seeding

The application automatically creates an admin user on startup if one doesn't exist. The admin credentials are read from environment variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FIRST_NAME`
- `ADMIN_LAST_NAME`

## Email Configuration

The application uses Nodemailer for sending password reset emails. Configure your email service in the environment variables.

For Gmail:
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `EMAIL_PASS`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Run database seeding script

## Project Structure

```
src/
├── config/             # Configuration files
│   └── database.ts     # MongoDB connection
├── controllers/        # Route controllers
│   ├── authController.ts
│   └── userController.ts
├── middleware/         # Express middleware
│   ├── auth.ts         # Authentication middleware
│   └── validation.ts   # Input validation
├── models/             # Mongoose models
│   └── User.ts
├── routes/             # Express routes
│   ├── auth.ts
│   └── users.ts
├── scripts/            # Utility scripts
│   └── seed.ts         # Database seeding
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── email.ts        # Email functionality
└── server.ts           # Main server file
```

## Error Handling

The API includes comprehensive error handling:

- Validation errors with detailed messages
- Authentication and authorization errors
- Database connection errors
- Global error handler for unexpected errors

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include input validation
4. Write meaningful commit messages
5. Test all endpoints thoroughly
