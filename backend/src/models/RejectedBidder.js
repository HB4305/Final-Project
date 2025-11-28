import mongoose from 'mongoose';

const rejectedBidderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
rejectedBidderSchema.index({ productId: 1, bidderId: 1 }, { unique: true });
rejectedBidderSchema.index({ productId: 1 });
rejectedBidderSchema.index({ bidderId: 1 });

export default mongoose.model('RejectedBidder', rejectedBidderSchema);
