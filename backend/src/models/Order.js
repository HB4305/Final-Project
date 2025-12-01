import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
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
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  finalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND'
  },
  status: {
    type: String,
    enum: ['awaiting_payment', 'seller_confirmed_payment', 'shipped', 'completed', 'cancelled'],
    default: 'awaiting_payment'
  },
  buyerPaymentProof: {
    url: String,
    uploadedAt: Date,
    _id: false
  },
  shippingInfo: {
    carrier: String,
    trackingNumber: String,
    shippedAt: Date,
    _id: false
  },
  buyerConfirmReceivedAt: {
    type: Date,
    default: null
  },
  chatRefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
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
orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });
orderSchema.index({ auctionId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Update updatedAt on save
orderSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

export default mongoose.model('Order', orderSchema);
