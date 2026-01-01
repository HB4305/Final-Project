/**
 * ============================================
 * PRODUCT ROUTES
 * API 1.2, 1.3, 1.4, 1.5
 * ============================================
 */

import express from 'express';
import bidRouter from './bid.js';
import {
  getAllProducts,
  getTopProducts,
  getProductsByCategory,
  searchProducts,
  getProductDetail,
  postProduct,
  toggleAutoExtend,
  updateProductDescription,
  rejectBidder,
  withdrawBid,
  deleteProduct
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
  uploadProductImages,      // ← Phải có middleware này TRƯỚC validate
  validateProductImages,
  postProduct
);

/**
 * API 3.2: Bổ sung thông tin mô tả sản phẩm
 * PUT /api/products/:productId/description
 * Requires: Authentication, must be seller or admin
 * Body: { description, metadata }
 */
router.put('/:productId/description',
  authenticate,
  updateProductDescription
);

/**
 * API 3.3: Từ chối lượt ra giá của bidder
 * POST /api/products/:productId/reject-bidder
 * Requires: Authentication, must be seller or admin
 * Body: { bidderId, reason }
 */
router.post('/:productId/reject-bidder',
  authenticate,
  rejectBidder
);

/**
 * API 3.3: Bidder tự rút lại bid
 * POST /api/products/:productId/withdraw-bid
 * Requires: Authentication
 * Body: { reason } (optional)
 */
router.post('/:productId/withdraw-bid',
  authenticate,
  withdrawBid
);

/**
 * API: Toggle auto-extend
 * PUT /api/products/:productId/auto-extend
 * Requires: Authentication, must be seller or admin
 * Body: { autoExtendEnabled: boolean }
 */
router.put('/:productId/auto-extend',
  authenticate,
  toggleAutoExtend
);

/**
 * API: Xóa sản phẩm (Admin only)
 * DELETE /api/products/:productId
 * Requires: Authentication, must be admin
 */
router.delete('/:productId',
  authenticate,
  deleteProduct
);

router.use('/:productId/bids', bidRouter);

export default router;
