const express = require('express');
const router = express.Router();
const productController = require('../controller/productController.js');

// Định nghĩa các đường dẫn
// GET /api/products -> Gọi hàm getProducts
router.get('/', productController.getProducts);

// GET /api/products/:id -> Gọi hàm getProductById
router.get('/:id', productController.getProductById);

module.exports = router;