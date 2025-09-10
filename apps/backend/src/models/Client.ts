import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  phoneNumber: string;
  name?: string;
  email?: string;
  company?: string;
  status: 'prospect' | 'active' | 'converted' | 'inactive';
  lastCallDate?: Date;
  totalCalls: number;
  lastInteraction?: string;
  notes?: string;
  websites?: Array<{
    url: string;
    fileName: string;
    deployedAt: Date;
    lastModified?: Date;
    isActive: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  company: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['prospect', 'active', 'converted', 'inactive'],
    default: 'prospect'
  },
  lastCallDate: {
    type: Date,
    required: false
  },
  totalCalls: {
    type: Number,
    default: 0
  },
  lastInteraction: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
  },
  websites: [{
    url: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    deployedAt: {
      type: Date,
      default: Date.now
    },
    lastModified: {
      type: Date,
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

export const Client = mongoose.model<IClient>('Client', ClientSchema);
