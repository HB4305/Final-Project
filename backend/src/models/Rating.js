import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  raterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rateeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  context: {
    type: String,
    enum: ['nguoi_mua_danh_gia', 'nguoi_ban_danh_gia', 'danh_gia_giao_dich'],
    required: true
  },
  score: {
    type: Number,
    enum: [-1, 1],
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ratingSchema.index({ rateeId: 1, createdAt: -1 });
ratingSchema.index({ raterId: 1 });
ratingSchema.index({ orderId: 1 });

export default mongoose.model('Rating', ratingSchema);
