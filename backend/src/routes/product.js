/**
 * ============================================
 * PRODUCT ROUTES
 * API 1.2, 1.3, 1.4, 1.5
 * ============================================
 */

import express from 'express';
import {
  getAllProducts,
  getTopProducts,
  getProductsByCategory,
  searchProducts,
  getProductDetail,
  postProduct,
  toggleAutoExtend,
  updateProductDescription,
  rejectBidder
} from '../controllers/product.js';

import {
  uploadProductImages,
  validateProductImages,
  handleMulterError,
} from '../middlewares/upload.js';

import { authenticate } from '../middlewares/auth.js';
import { checkSellerExpiration } from '../middlewares/roles.js';

const router = express.Router();

/**
 * API 1.1: Lấy tất cả sản phẩm (phân trang, không lọc)
 * Hiển thị danh sách sản phẩm đang hoạt động với các tùy chọn sắp xếp
 * - newest (mới nhất)
 * GET /api/products?page=1&limit=12&sortBy=newest
 */
router.get('/', getAllProducts);

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

/**
 * API 3.1:  Đăng sản phẩm đấu giá
 * POST /api/products
 * Requires: Authentication, valid seller role (not expired)
 */
router.post('/',
  authenticate,
  checkSellerExpiration,
  // uploadProductImages,  
  // handleMulterError,        
  // validateProductImages,   
  postProduct
);

/**
 * API 3.1: Toggle auto-extend for seller's auction
 * PUT /api/products/:productId/auto-extend
 * Body: { autoExtendEnabled: true/false }
 * Requires: Authentication (seller only)
 */
// Tạm thời comment authenticate để test
// router.put('/:productId/auto-extend', authenticate, authorize(USER_ROLES.SELLER), toggleAutoExtend);
router.put('/:productId/auto-extend', toggleAutoExtend);

/**
 * API 3.2: Bổ sung thông tin mô tả sản phẩm
 * PUT /api/products/:productId/description
 * Body: { description: string, metadata: object }
 * Requires: Authentication (seller only)
 */
// Tạm thời không cần authenticate để test
// router.put('/:productId/description', authenticate, authorize(USER_ROLES.SELLER), updateProductDescription);
router.put('/:productId/description', updateProductDescription);

/**
 * API 3.3: Từ chối lượt ra giá của bidder
 * POST /api/products/:productId/reject-bidder
 * Body: { bidderId: string, reason: string }
 * Requires: Authentication (seller only)
 */
// Tạm thời không cần authenticate để test
// router.post('/:productId/reject-bidder', authenticate, authorize(USER_ROLES.SELLER), rejectBidder);
router.post('/:productId/reject-bidder', rejectBidder);

export default router;
