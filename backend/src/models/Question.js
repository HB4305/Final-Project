import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    default: null
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  answers: [
    {
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      _id: false
    }
  ],
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
questionSchema.index({ productId: 1, createdAt: -1 });
questionSchema.index({ authorId: 1 });

export default mongoose.model('Question', questionSchema);
