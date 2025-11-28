import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
watchlistSchema.index({ userId: 1, watchedAt: -1 });
watchlistSchema.index({ productId: 1 });
watchlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model('Watchlist', watchlistSchema);
