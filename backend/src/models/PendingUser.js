// MODEL: Pending User (Người dùng chờ xác thực)

import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: "",
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Tự động xóa sau 1 giờ nếu không verify
  },
});

// Index để tìm kiếm nhanh
pendingUserSchema.index({ email: 1 });
pendingUserSchema.index({ username: 1 });

export const PendingUser = mongoose.model("PendingUser", pendingUserSchema);
