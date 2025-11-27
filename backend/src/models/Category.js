const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Trường parent dùng để xác định cấp danh mục
    // - Nếu parent = null hoặc không có: Là danh mục CHA (Cấp 1 - VD: Điện tử)
    // - Nếu parent có giá trị ID: Là danh mục CON (Cấp 2 - VD: Điện thoại)
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);