// ROUTES: Auction Routes

import express from 'express';
import {
  createAuction,
  getEndingSoonAuctions,
  getMostBidsAuctions,
  getHighestPriceAuctions,
  getAuctionDetail,
  endAuction,
  cancelAuction
} from '../controllers/auction.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';
import {
  validateAuctionInput,
  validateIdParam
} from '../middlewares/validation.js';

const router = express.Router();

/**
 * POST /api/auctions/:productId
 * Tạo cuộc đấu giá cho sản phẩm
 * Yêu cầu: là seller chủ sản phẩm hoặc admin
 */
router.post(
  '/:productId',
  authenticate,
  authorize('seller', 'admin'),
  validateIdParam('productId'),
  validateAuctionInput,
  createAuction
);

/**
 * GET /api/auctions/ending-soon
 * Lấy danh sách cuộc đấu giá sắp kết thúc
 */
router.get('/ending-soon', getEndingSoonAuctions);

/**
 * GET /api/auctions/most-bids
 * Lấy danh sách cuộc đấu giá có nhiều bids nhất
 */
router.get('/most-bids', getMostBidsAuctions);

/**
 * GET /api/auctions/highest-price
 * Lấy danh sách cuộc đấu giá có giá cao nhất
 */
router.get('/highest-price', getHighestPriceAuctions);

/**
 * GET /api/auctions/:auctionId
 * Lấy chi tiết cuộc đấu giá
 */
router.get(
  '/:auctionId',
  validateIdParam('auctionId'),
  getAuctionDetail
);

/**
 * POST /api/auctions/:auctionId/end
 * Kết thúc cuộc đấu giá (thường được gọi bởi cron job)
 * Yêu cầu: là admin
 */
router.post(
  '/:auctionId/end',
  authenticate,
  authorize('admin'),
  validateIdParam('auctionId'),
  endAuction
);

/**
 * POST /api/auctions/:auctionId/cancel
 * Hủy cuộc đấu giá
 * Yêu cầu: là seller chủ sản phẩm hoặc admin
 */
router.post(
  '/:auctionId/cancel',
  authenticate,
  authorize('seller', 'admin'),
  validateIdParam('auctionId'),
  cancelAuction
);

export default router;
