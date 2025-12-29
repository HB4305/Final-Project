import mongoose from 'mongoose';

const rejectedBidderSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
rejectedBidderSchema.index({ product: 1, bidder: 1 }, { unique: true });
rejectedBidderSchema.index({ product: 1 });
rejectedBidderSchema.index({ bidder: 1 });

export default mongoose.model('RejectedBidder', rejectedBidderSchema);
