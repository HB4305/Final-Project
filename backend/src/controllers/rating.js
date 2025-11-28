import { ratingService } from '../services/RatingService.js';
import { AppError } from '../utils/errors.js';

/**
 * Controller tạo đánh giá cho người khác
 */
export const createRating = async (req, res, next) => {
  try {
    const { rateeId } = req.params;
    const { score, comment, orderId, context } = req.body;
    const raterId = req.user._id;

    const rating = await ratingService.createRating(raterId, rateeId, {
      score,
      comment,
      orderId,
      context
    });

    res.status(201).json({
      status: 'success',
      message: 'Đánh giá thành công',
      data: { rating }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller cập nhật đánh giá
 */
export const updateRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { score, comment } = req.body;
    const raterId = req.user._id;

    const rating = await ratingService.updateRating(ratingId, raterId, {
      score,
      comment
    });

    res.status(200).json({
      status: 'success',
      message: 'Cập nhật đánh giá thành công',
      data: { rating }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller xoá đánh giá
 */
export const deleteRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const raterId = req.user._id;

    const result = await ratingService.deleteRating(ratingId, raterId);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy tất cả đánh giá của một user
 */
export const getUserRatings = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await ratingService.getUserRatings(
      userId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy thống kê đánh giá của một user
 */
export const getUserRatingStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const stats = await ratingService.getUserRatingStats(userId);

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
