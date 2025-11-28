import mongoose from 'mongoose';

// ========================================
// Product Schema (API 1.3, 1.4, 1.5)
// Đại diện cho sản phẩm trong hệ thống đấu giá
// ========================================

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  // API 1.4: Tên sản phẩm (dùng cho full-text search)
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    lowercase: true
  },
  // API 1.5: Lịch sử mô tả sản phẩm
  descriptionHistory: [
    {
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      _id: false
    }
  ],
  // API 1.3, 1.5: Hình ảnh chính
  primaryImageUrl: {
    type: String,
    required: true
  },
  // API 1.3, 1.5: Danh sách ảnh bổ sung
  imageUrls: {
    type: [String],
    validate: {
      validator: (v) => v.length >= 3,
      message: 'At least 3 images are required'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  flags: {
    featured: {
      type: Boolean,
      default: false
    },
    highlightedUntil: {
      type: Date,
      default: null
    },
    isNewUntil: {
      type: Date,
      default: null
    },
    _id: false
  },
  baseCurrency: {
    type: String,
    default: 'VND'
  },
  // API 1.5: Metadata sản phẩm
  metadata: {
    brand: String,
    model: String,
    condition: String,
    specs: mongoose.Schema.Types.Mixed
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

// ========================================
// INDEXES (Quan trọng cho performance)
// ========================================
// API 1.4: Text index cho full-text search
productSchema.index({ title: 'text', 'metadata.brand': 'text' });
// API 1.3: Query theo danh mục + thời gian
productSchema.index({ categoryId: 1, createdAt: -1 });
// Lọc theo người bán
productSchema.index({ sellerId: 1 });
// Lọc theo trạng thái active
productSchema.index({ isActive: 1 });

// Update updatedAt on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Product', productSchema);
