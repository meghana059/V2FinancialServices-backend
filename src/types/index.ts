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
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  twoFactorSetupCompleted?: boolean;
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

export interface ITwoFactorSetupResponse {
  success: boolean;
  message: string;
  qrCodeUrl?: string;
  secret?: string;
  backupCodes?: string[];
}

export interface ITwoFactorVerifyInput {
  token: string;
  twoFactorToken?: string;
}

// 2FA is mandatory - disable interface removed

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
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
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

// Invoice Generation Types
export interface IInvoiceData {
  entityId: string;
  entityName: string;
  groupName: string;
  entityPath: string;
  inceptionDate: string;
  inceptionBenchmark: number;
  yearBenchmark: number;
  performanceFeeRate: number;
  feeCap: number;
  inceptionPerformance: number;
  periodEndingMarketValue: number;
  periodPerformance: number;
  periodBeginningMarketValue: number;
  q1Fees?: number;
  q2Fees?: number;
  q3Fees?: number;
  q4Fees?: number;
  accountsPayingFees?: string;
}

export interface IInvoiceCalculations {
  excessReturn: number;
  performanceFee: number;
  totalFees: number;
  adjustedTotalFees: number;
  adjustedFinalFees: number;
}

export interface IInvoiceGenerationRequest {
  templateId: string;
  invoiceYear: string;
  inputFile: Express.Multer.File;
}

export interface IInvoiceJobResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface IInvoiceTemplateResponse {
  _id: string;
  name: string;
  description?: string;
  fileName: string;
  isDefault: boolean;
  createdAt: string;
}
