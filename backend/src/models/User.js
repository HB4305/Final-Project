const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Đã hash
    fullName: { type: String, required: true },
    role: {
        type: String,
        enum: ['guest', 'bidder', 'seller', 'admin'],
        default: 'bidder'
    },
    address: String,

    // Điểm đánh giá (để tính quy tắc 80%)
    goodRatings: { type: Number, default: 0 }, // Số lượt +1
    badRatings: { type: Number, default: 0 },  // Số lượt -1

    // Danh sách yêu thích (Watch List)
    watchList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Yêu cầu nâng cấp seller (nếu có)
    isUpgradeRequested: { type: Boolean, default: false }
}, { timestamps: true });

// Virtual field: Tính % uy tín
userSchema.virtual('reputation').get(function () {
    const total = this.goodRatings + this.badRatings;
    if (total === 0) return 100; // Chưa ai đánh giá thì coi như uy tín
    return (this.goodRatings / total) * 100;
});

module.exports = mongoose.model('User', userSchema);