<<<<<<< HEAD
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    time: { type: Date, default: Date.now },

    // Loại bid: Thủ công hay Tự động (Yêu cầu 6.2)
    isAutoBid: { type: Boolean, default: false },
    maxAutoBidPrice: { type: Number } // Giá tối đa nếu là auto bid
});

module.exports = mongoose.model('Bid', bidSchema);
=======
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
>>>>>>> c99b01d06ad0d7f7b3901d77c882a7fa06447179
