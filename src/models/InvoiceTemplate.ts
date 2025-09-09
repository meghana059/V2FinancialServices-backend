import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceTemplate extends Document {
  name: string;
  description?: string;
  filePath: string;
  fileName: string;
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceTemplateSchema = new Schema<IInvoiceTemplate>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one default template
InvoiceTemplateSchema.index({ isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

export default mongoose.model<IInvoiceTemplate>('InvoiceTemplate', InvoiceTemplateSchema);
