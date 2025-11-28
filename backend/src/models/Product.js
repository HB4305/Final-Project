import mongoose from 'mongoose';

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
  primaryImageUrl: {
    type: String,
    required: true
  },
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

// Indexes
productSchema.index({ title: 'text', 'metadata.brand': 'text' });
productSchema.index({ categoryId: 1, createdAt: -1 });
productSchema.index({ sellerId: 1 });

// Update updatedAt on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Product', productSchema);
