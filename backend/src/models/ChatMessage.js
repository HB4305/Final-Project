import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachmentUrl: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
chatMessageSchema.index({ orderId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1, recipientId: 1 });
chatMessageSchema.index({ recipientId: 1, isRead: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
