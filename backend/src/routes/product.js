/**
 * ============================================
 * PRODUCT ROUTES
 * API 1.2, 1.3, 1.4, 1.5
 * ============================================
 */

import express from 'express';
import {
  getTopProducts,
  getProductsByCategory,
  searchProducts,
  getProductDetail
} from '../controllers/product.js';

const router = express.Router();

/**
 * API 1.2: Lấy Top 5 sản phẩm (Trang chủ)
 * GET /api/products/home/top
 * Response: { endingSoon, mostBids, highestPrice }
 */
router.get('/home/top', getTopProducts);

/**
 * API 1.4: Tìm kiếm sản phẩm (Full-text search)
 * GET /api/products/search?q=keyword&sortBy=price_desc
 * Query params: q, categoryId, minPrice, maxPrice, sortBy, page, limit
 */
router.get('/search', searchProducts);

/**
 * API 1.3: Danh sách sản phẩm theo danh mục (phân trang)
 * GET /api/products/category/:categoryId?page=1&limit=12&sortBy=newest
 */
router.get('/category/:categoryId', getProductsByCategory);

/**
 * API 1.5: Chi tiết sản phẩm (đầy đủ)
 * GET /api/products/:productId
 * Response: { product, relatedProducts }
 */
router.get('/:productId', getProductDetail);

export default router;
