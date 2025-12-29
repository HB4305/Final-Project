// ROUTES: Bid Routes


import express from 'express';
import {
  placeBid,
  getBidHistory,
  rejectBidder,
  getBidCount
} from '../controllers/bid.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';
import {
  validateBidInput,
  validateIdParam
} from '../middlewares/validation.js';

const router = express.Router({ mergeParams: true }); // ✅ THÊM DÒNG NÀY

/**
 * POST /api/products/:productId/bids
 * Đặt giá cho sản phẩm (mounted từ product routes)
 * Yêu cầu: đã đăng nhập
 */
router.post(
  '/',
  authenticate,
  validateBidInput,
  placeBid
);


/**
 * POST /api/bids/:auctionId
 * Đặt giá cho cuộc đấu giá
 * Yêu cầu: đã đăng nhập
 */
router.post(
  '/:auctionId',
  authenticate,
  validateIdParam('auctionId'),
  validateBidInput,
  placeBid
);

/**
 * GET /api/bids/:auctionId/history
 * Lấy lịch sử đặt giá của cuộc đấu giá
 */
router.get(
  '/:auctionId/history',
  validateIdParam('auctionId'),
  getBidHistory
);

/**
 * GET /api/bids/:auctionId/count
 * Lấy số lượng bids của user hiện tại trong cuộc đấu giá
 */
router.get(
  '/:auctionId/count',
  authenticate,
  validateIdParam('auctionId'),
  getBidCount
);

/**
 * POST /api/bids/:productId/reject/:bidderId
 * Từ chối lượt ra giá của bidder
 * Yêu cầu: là seller chủ sản phẩm hoặc admin
 */
router.post(
  '/:productId/reject/:bidderId',
  authenticate,
  authorize('seller', 'admin'),
  validateIdParam('productId'),
  validateIdParam('bidderId'),
  rejectBidder
);

export default router;
