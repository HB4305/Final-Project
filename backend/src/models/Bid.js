const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    time: { type: Date, default: Date.now },

    // Loại bid: Thủ công hay Tự động (Yêu cầu 6.2)
    isAutoBid: { type: Boolean, default: false },
    maxAutoBidPrice: { type: Number } // Giá tối đa nếu là auto bid
});

module.exports = mongoose.model('Bid', bidSchema);