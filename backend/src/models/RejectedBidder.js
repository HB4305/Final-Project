import mongoose from 'mongoose';

const rejectedBidderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  rejectedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
rejectedBidderSchema.index({ productId: 1, bidderId: 1 });
rejectedBidderSchema.index({ productId: 1 });
rejectedBidderSchema.index({ bidderId: 1 });

export default mongoose.model('RejectedBidder', rejectedBidderSchema);
