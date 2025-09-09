import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceJob extends Document {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
  createdBy: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  inputFileName: string;
  inputFilePath: string;
  invoiceYear: string;
  totalEntities: number;
  processedEntities: number;
  outputDirectory: string;
  generatedFiles: string[];
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceJobSchema = new Schema<IInvoiceJob>({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'paused'],
    default: 'pending'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'InvoiceTemplate',
    required: true
  },
  inputFileName: {
    type: String,
    required: true
  },
  inputFilePath: {
    type: String,
    required: true
  },
  invoiceYear: {
    type: String,
    required: true
  },
  totalEntities: {
    type: Number,
    default: 0
  },
  processedEntities: {
    type: Number,
    default: 0
  },
  outputDirectory: {
    type: String,
    required: true
  },
  generatedFiles: [{
    type: String
  }],
  errorMessage: {
    type: String
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<IInvoiceJob>('InvoiceJob', InvoiceJobSchema);
