import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  isAuto: {
    type: Boolean,
    default: false
  },
  metadata: {
    proxyFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
bidSchema.index({ auctionId: 1, createdAt: -1 });
bidSchema.index({ bidderId: 1, auctionId: 1 });
bidSchema.index({ productId: 1, createdAt: -1 });
bidSchema.index({ auctionId: 1, amount: -1 });

export default mongoose.model('Bid', bidSchema);
