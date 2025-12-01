import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: "global",
  },
  autoExtendWindowSec: {
    type: Number,
    default: 300,
  },
  autoExtendAmountSec: {
    type: Number,
    default: 600,
  },
  allowUnratedBidders: {
    type: Boolean,
    default: false,
  },
  minRatingPercentToBid: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1,
  },
  buyNowEnabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  key: {
    type: String,
    required: true,
    unique: true,
    enum: [
      "autoExtendEnabled", // Turn on/off auto extend
      "autoExtendThreshold", //  Giới hạn cuối - mặc định: 5
      "autoExtendDuration", // Thời gian dược gia hạn - mặc định: 10 phút cuối
      "sellerExtendEnabled", // Seller tự động gia hạn
      "sellerExtenedeMaxCount", // Số lần gia hạn tối đa của Seller
    ],
  },

  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  description: {
    type: String,
  },

  updateBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

//Index
// systemSettingSchema.index({ key: 1 });

// Update updatedAt on save
systemSettingSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

/**
 * Helper: Lấy giá trị setting
 */
systemSettingSchema.statics.getSetting = async function (key, defaultValue) {
  const res = await this.findOne({ key });
  return res ? res.value : defaultValue;
};

/**
 * Helper: Cập nhật setting
 */

systemSettingSchema.statics.updateSetting = async function (
  key,
  value,
  adminId
) {
  return await this.findOneAndUpdate(
    { key },
    {
      value,
      updateBy: adminId,
      updateAt: Date.now(),
    },
    {
      upsert: true, // Tạo mới nếu như chưa có
      new: true,
    }
  );
};

export default mongoose.model("SystemSetting", systemSettingSchema);
