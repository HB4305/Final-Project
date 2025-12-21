import mongoose from "mongoose";

/**
 * ============================================
 * SYSTEM SETTING - Cấu hình hệ thống
 * ============================================
 * Admin quản lý các tham số toàn hệ thống
 * Mỗi setting là 1 document với key-value
 */
const systemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: [
      "autoExtendEnabled",      // Bật/tắt auto-extend toàn hệ thống
      "autoExtendThreshold",    // Ngưỡng thời gian (phút) - mặc định 5
      "autoExtendDuration",     // Thời gian gia hạn (phút) - mặc định 10
    ],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index
systemSettingSchema.index({ key: 1 });

// Middleware
systemSettingSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

/**
 * Static method: Lấy giá trị setting
 * @param {string} key - Setting key
 * @param {*} defaultValue - Giá trị mặc định nếu không tìm thấy
 * @returns {*} Setting value hoặc defaultValue
 */
systemSettingSchema.statics.getSetting = async function (key, defaultValue) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

/**
 * Static method: Cập nhật setting
 * @param {string} key - Setting key
 * @param {*} value - Giá trị mới
 * @param {string} adminId - Admin ID thực hiện update
 * @returns {Object} Updated setting document
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
      updatedBy: adminId,
      updatedAt: Date.now(),
    },
    {
      upsert: true,  // Tạo mới nếu chưa có
      new: true,     // Trả về document sau khi update
    }
  );
};

export default mongoose.model("SystemSetting", systemSettingSchema);
