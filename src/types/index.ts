export interface IUser {
  email: string;
  phoneNumber: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserInput {
  email: string;
  phoneNumber: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IResetPasswordInput {
  token: string;
  password: string;
}

export interface IRequestPasswordResetInput {
  email: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    _id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
