import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentHighestBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  currentHighestBidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bidCount: {
    type: Number,
    default: 0,
    min: 0
  },
  buyNowPrice: {
    type: Number,
    default: null,
    min: 0
  },
  priceStep: {
    type: Number,
    required: true,
    min: 0
  },
  startAt: {
    type: Date,
    required: true
  },
  endAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  autoExtendEnabled: {
    type: Boolean,
    default: false
  },
  autoExtendWindowSec: {
    type: Number,
    default: 300
  },
  autoExtendAmountSec: {
    type: Number,
    default: 600
  },
  lastExtendedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
auctionSchema.index({ status: 1, endAt: 1 });
auctionSchema.index({ endAt: 1 });
auctionSchema.index({ productId: 1 });
auctionSchema.index({ currentHighestBidderId: 1 });
auctionSchema.index({ status: 1, endAt: 1, bidCount: -1 });

// Update updatedAt on save
auctionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Auction', auctionSchema);
