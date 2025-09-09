import mongoose, { Document, Schema } from 'mongoose';

export interface ICallRecord extends Document {
  clientId: mongoose.Types.ObjectId;
  phoneNumber: string;
  timestamp: Date;
  duration: number;
  transcript: string;
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number;
  direction: 'inbound' | 'outbound';
  status: 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy' | 'declined';
  outcome: 'successful' | 'follow_up' | 'no_answer' | 'busy' | 'declined';
  aiSuggestions: Array<{
    text: string;
    offer_id: string;
    type: string;
    confidence: number;
    deliver_as: string;
    reasoning?: string;
  }>;
  metadata?: {
    callerId?: string;
    location?: string;
    device?: string;
    audioUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CallRecordSchema = new Schema<ICallRecord>({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number,
    required: true,
    default: 0
  },
  transcript: {
    type: String,
    required: false,
    default: ''
  },
  mood: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    required: true
  },
  sentiment: {
    type: Number,
    required: true,
    min: -1,
    max: 1
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'failed', 'no_answer', 'busy', 'declined'],
    required: false,
    default: 'in_progress'
  },
  outcome: {
    type: String,
    enum: ['successful', 'follow_up', 'no_answer', 'busy', 'declined'],
    required: false,
    default: 'follow_up'
  },
  aiSuggestions: {
    type: [{
      text: { type: String, required: true },
      offer_id: { type: String, required: true },
      type: { type: String, required: true },
      confidence: { type: Number, required: true },
      deliver_as: { type: String, required: true },
      reasoning: { type: String, required: false }
    }],
    default: []
  },
  metadata: {
    callerId: String,
    location: String,
    device: String,
    audioUrl: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
CallRecordSchema.index({ clientId: 1, timestamp: -1 });
CallRecordSchema.index({ phoneNumber: 1, timestamp: -1 });

export const CallRecord = mongoose.model<ICallRecord>('CallRecord', CallRecordSchema);
