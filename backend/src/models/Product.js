const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Thông tin giá
    startPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true }, // Cập nhật liên tục khi có người bid
    stepPrice: { type: Number, required: true },    // Bước giá
    buyNowPrice: { type: Number },                  // Giá mua ngay (optional)

    // Người đang giữ giá cao nhất
    highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Hình ảnh & Mô tả
    images: [String], // Mảng chứa URL ảnh. Ảnh đầu tiên là avatar
    description: { type: String }, // HTML content

    // Thời gian
    postDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isAutoRenew: { type: Boolean, default: false }, // Tự động gia hạn

    status: {
        type: String,
        enum: ['active', 'finished'], // Đang đấu hoặc Đã xong
        default: 'active'
    }
}, { timestamps: true });

// TẠO INDEX CHO FULL-TEXT SEARCH (Yêu cầu 1.4)
// Giúp tìm kiếm theo tên sản phẩm nhanh chóng
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);