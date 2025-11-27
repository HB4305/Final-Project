const mongoose = require("mongoose");

// Khai báo Schema với tên biến là UserSchema (U hoa)
const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    dob: {
      type: Date, // Ngày sinh [cite: 176]
    },
    role: {
      type: String,
      default: "bidder", // bidder, seller, admin
      enum: ["bidder", "seller", "admin"],
    },
    isVerified: {
      type: Boolean,
      default: false, // Mặc định chưa kích hoạt
    },
    otp: {
      type: String, // Mã OTP 6 số
    },
    otpExpiry: {
      type: Date, // Thời hạn OTP
    },
    // Danh sách sản phẩm yêu thích (Watch List) [cite: 65]
    watchList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],
    // Lưu lịch sử đánh giá để tính điểm uy tín [cite: 71, 87]
    ratings: [
      {
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        point: { type: Number, enum: [1, -1] }, // +1 (tốt) hoặc -1 (xấu)
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true }, // Quan trọng: Cho phép hiện virtual field khi convert sang JSON
    toObject: { virtuals: true },
  }
);

// SỬA LỖI Ở ĐÂY: Dùng đúng tên biến UserSchema (U hoa)
// Tính điểm uy tín (Reputation) dựa trên % đánh giá tốt [cite: 70, 71]
UserSchema.virtual("reputation").get(function () {
  if (!this.ratings || this.ratings.length === 0) {
    return 0; // Chưa có đánh giá nào
  }

  const positiveRatings = this.ratings.filter((r) => r.point === 1).length;
  const totalRatings = this.ratings.length;

  // Trả về tỷ lệ phần trăm (Ví dụ: 80 nghĩa là 80%)
  return (positiveRatings / totalRatings) * 100;
});

module.exports = mongoose.model("user", UserSchema);
