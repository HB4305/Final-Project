// ROUTES: Rating Routes

import express from 'express';
import {
  createRating,
  updateRating,
  deleteRating,
  getUserRatings,
  getUserRatingStats
} from '../controllers/rating.js';
import { authenticate } from '../middlewares/auth.js';
import {
  validateRatingInput,
  validateIdParam
} from '../middlewares/validation.js';

const router = express.Router();

/**
 * POST /api/ratings/:rateeId
 * Tạo đánh giá cho người dùng
 * Yêu cầu: đã đăng nhập
 */
router.post(
  '/:rateeId',
  authenticate,
  validateIdParam('rateeId'),
  validateRatingInput,
  createRating
);

/**
 * PUT /api/ratings/:ratingId
 * Cập nhật đánh giá
 * Yêu cầu: là người tạo rating
 */
router.put(
  '/:ratingId',
  authenticate,
  validateIdParam('ratingId'),
  validateRatingInput,
  updateRating
);

/**
 * DELETE /api/ratings/:ratingId
 * Xoá đánh giá
 * Yêu cầu: là người tạo rating
 */
router.delete(
  '/:ratingId',
  authenticate,
  validateIdParam('ratingId'),
  deleteRating
);

/**
 * GET /api/ratings/:userId
 * Lấy tất cả đánh giá của một user
 */
router.get(
  '/:userId',
  validateIdParam('userId'),
  getUserRatings
);

/**
 * GET /api/ratings/:userId/stats
 * Lấy thống kê đánh giá của một user
 */
router.get(
  '/:userId/stats',
  validateIdParam('userId'),
  getUserRatingStats
);

export default router;
