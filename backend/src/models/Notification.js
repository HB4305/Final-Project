import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  recipients: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      email: String,
      _id: false
    }
  ],
  payload: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
notificationSchema.index({ status: 1, createdAt: 1 });
notificationSchema.index({ 'recipients.userId': 1 });

export default mongoose.model('Notification', notificationSchema);
