const Product = require('../models/Product.js');
const Category = require('../models/Category.js');
const User = require('../models/User');

// Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
    try {
        // Lấy tất cả sản phẩm
        // .populate('category') giúp lấy luôn tên danh mục thay vì chỉ lấy ID
        // .populate('seller') giúp lấy tên người bán
        const products = await Product.find()
            .populate('category', 'name')
            .populate('seller', 'fullName email')
            .sort({ postDate: -1 }); // Sắp xếp mới nhất lên đầu

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('seller', 'fullName rating');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};