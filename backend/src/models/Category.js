import mongoose from 'mongoose';

// ========================================
// Category Schema (API 1.1)
// Đại diện cho danh mục sản phẩm (2 cấp)
// Cấp 1 (parentId = null), Cấp 2 (parentId = category._id)
// ========================================

const categorySchema = new mongoose.Schema({
  // API 1.1: Tên danh mục
  name: {
    type: String,
    required: true,
    trim: true
  },
  // API 1.1: Slug cho URL friendly
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  // API 1.1: ID danh mục cha (null nếu là level 1)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  // Đường dẫn từ root (tree structure)
  path: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  // API 1.1: Cấp bậc (1 = cha, 2 = con)
  level: {
    type: Number,
    enum: [1, 2],
    required: true
  },
  // API 4.1: Soft delete support
  isActive: {
    type: Boolean,
    default: true
  },
  // API 4.1: Cached product count (updated periodically)
  productCount: {
    type: Number,
    default: 0
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
// API 1.1: Query danh mục con theo parentId
categorySchema.index({ parentId: 1 });
// Query theo tree path
categorySchema.index({ path: 1 });
// slug đã có unique: true trong schema, không cần định nghĩa lại

// Update updatedAt on save
categorySchema.pre('save', function() {
  this.updatedAt = Date.now();
});

export default mongoose.model('Category', categorySchema);
