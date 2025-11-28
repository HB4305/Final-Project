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
