import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkflow extends Document {
  _id: string;
  imgPath: string;
  label: string;
  frontendRoute: string;
  accessibleTo: 'admin' | 'user' | 'both';
  isAvailable: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workflowSchema = new Schema<IWorkflow>({
  imgPath: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  frontendRoute: {
    type: String,
    required: true,
    trim: true
  },
  accessibleTo: {
    type: String,
    enum: ['admin', 'user', 'both'],
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IWorkflow>('Workflow', workflowSchema);
