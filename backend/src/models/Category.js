<<<<<<< HEAD
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Trường parent dùng để xác định cấp danh mục
    // - Nếu parent = null hoặc không có: Là danh mục CHA (Cấp 1 - VD: Điện tử)
    // - Nếu parent có giá trị ID: Là danh mục CON (Cấp 2 - VD: Điện thoại)
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
=======
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  path: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  level: {
    type: Number,
    enum: [1, 2],
    required: true
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

// Indexes (slug đã có unique: true trong schema, không cần định nghĩa lại)
categorySchema.index({ parentId: 1 });
categorySchema.index({ path: 1 });

// Update updatedAt on save
categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Category', categorySchema);
>>>>>>> c99b01d06ad0d7f7b3901d77c882a7fa06447179
