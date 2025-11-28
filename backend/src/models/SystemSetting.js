import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'global'
  },
  autoExtendWindowSec: {
    type: Number,
    default: 300
  },
  autoExtendAmountSec: {
    type: Number,
    default: 600
  },
  allowUnratedBidders: {
    type: Boolean,
    default: false
  },
  minRatingPercentToBid: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1
  },
  buyNowEnabled: {
    type: Boolean,
    default: true
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

// Update updatedAt on save
systemSettingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('SystemSetting', systemSettingSchema);
