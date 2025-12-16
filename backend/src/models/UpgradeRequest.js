import mongoose from 'mongoose';

/**
 * ============================================
 * API 2.6, 4.3: Upgrade Request Model
 * Bidder xin nâng cấp lên Seller (7 ngày)
 * ============================================
 */

const upgradeRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Lý do xin nâng cấp
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  // Giấy tờ chứng minh (URLs)
  documents: [{
    type: String
  }],
  // Trạng thái request
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Admin reviewer
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  // Ghi chú của admin khi duyệt
  reviewNote: {
    type: String,
    maxlength: 500
  },
  // Thời gian request được tạo
  requestedAt: {
    type: Date,
    default: Date.now
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
upgradeRequestSchema.index({ user: 1, status: 1 });
upgradeRequestSchema.index({ status: 1, createdAt: -1 });
upgradeRequestSchema.index({ reviewedBy: 1 });

// Update updatedAt on save
upgradeRequestSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

export default mongoose.model('UpgradeRequest', upgradeRequestSchema);
