// SERVICE: Rating Service

import { Rating, User, Order } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { RATING_SCORE, RATING_CONTEXT } from "../lib/constants.js";

export class RatingService {
  /**
   * Tạo đánh giá cho người khác
   * @param {string} raterId - ID người đánh giá
   * @param {string} rateeId - ID người bị đánh giá
   * @param {Object} ratingData - { score, comment, orderId, context }
   * @returns {Object} Bản ghi đánh giá mới
   */
  async createRating(raterId, rateeId, ratingData) {
    const { score, comment = "", orderId, context } = ratingData;

    // 1. Validate score
    if (![RATING_SCORE.POSITIVE, RATING_SCORE.NEGATIVE].includes(score)) {
      throw new AppError("Điểm đánh giá không hợp lệ", 400);
    }

    // 2. Kiểm tra xem rating đã tồn tại chưa (không cho phép đánh giá lại cho cùng order)
    if (orderId) {
      const existingRating = await Rating.findOne({
        raterId,
        orderId,
        context,
      });
      if (existingRating) {
        throw new AppError("Bạn đã đánh giá cho đơn hàng này rồi", 400);
      }
    }

    // 3. Tạo rating mới
    const rating = new Rating({
      raterId,
      rateeId,
      score,
      comment,
      orderId: orderId || null,
      context: context || RATING_CONTEXT.POST_TRANSACTION,
    });

    await rating.save();

    // 4. Cập nhật ratingSummary của person bị đánh giá
    await this._updateUserRatingSummary(rateeId);

    return rating;
  }

  /**
   * Cập nhật đánh giá
   * @param {string} ratingId - ID của rating
   * @param {string} raterId - ID của người đánh giá (để kiểm tra ownership)
   * @param {Object} updateData - { score, comment }
   * @returns {Object} Rating đã cập nhật
   */
  async updateRating(ratingId, raterId, updateData) {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      throw new AppError("Đánh giá không tồn tại", 404);
    }

    // Kiểm tra rater
    if (!rating.raterId.equals(raterId)) {
      throw new AppError("Bạn không có quyền cập nhật đánh giá này", 403);
    }

    // Cập nhật
    if (updateData.score !== undefined) {
      if (
        ![RATING_SCORE.POSITIVE, RATING_SCORE.NEGATIVE].includes(
          updateData.score
        )
      ) {
        throw new AppError("Điểm đánh giá không hợp lệ", 400);
      }
      rating.score = updateData.score;
    }

    if (updateData.comment !== undefined) {
      rating.comment = updateData.comment;
    }

    await rating.save();

    // Cập nhật ratingSummary của người bị đánh giá
    await this._updateUserRatingSummary(rating.rateeId);

    return rating;
  }

  /**
   * Lấy tất cả đánh giá của một user
   * @param {string} userId - ID user
   * @param {number} page - Trang (mặc định 1)
   * @param {number} limit - Số record mỗi trang (mặc định 10)
   * @param {string} type - 'received' | 'given' (mặc định 'received')
   * @returns {Object} { ratings, total, page, pages }
   */
  async getUserRatings(userId, page = 1, limit = 10, type = "received") {
    const skip = (page - 1) * limit;

    const query = type === "given" ? { raterId: userId } : { rateeId: userId };
    const populateField = type === "given" ? "rateeId" : "raterId";

    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .populate(populateField, "username profileImageUrl fullName")
        .populate({
          path: "orderId",
          select: "productId",
          populate: { path: "productId", select: "title slug primaryImageUrl" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Rating.countDocuments(query),
    ]);

    return {
      ratings,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Xoá đánh giá
   * @param {string} ratingId - ID của rating
   * @param {string} raterId - ID của người đánh giá (để kiểm tra ownership)
   */
  async deleteRating(ratingId, raterId) {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      throw new AppError("Đánh giá không tồn tại", 404);
    }

    if (!rating.raterId.equals(raterId)) {
      throw new AppError("Bạn không có quyền xoá đánh giá này", 403);
    }

    const rateeId = rating.rateeId;
    await Rating.deleteOne({ _id: ratingId });

    // Cập nhật ratingSummary sau khi xoá
    await this._updateUserRatingSummary(rateeId);

    return { message: "Xoá đánh giá thành công" };
  }

  /**
   * Tính toán lại ratingSummary cho một user
   * @private
   * @param {string} userId - ID user
   */
  async _updateUserRatingSummary(userId) {
    const ratings = await Rating.find({ rateeId: userId });

    const countPositive = ratings.filter(
      (r) => r.score === RATING_SCORE.POSITIVE
    ).length;
    const countNegative = ratings.filter(
      (r) => r.score === RATING_SCORE.NEGATIVE
    ).length;
    const totalCount = ratings.length;
    // Score calculation: (positive / total) * 5
    const score = totalCount === 0 ? 0 : (countPositive / totalCount) * 5;

    await User.updateOne(
      { _id: userId },
      {
        "ratingSummary.countPositive": countPositive,
        "ratingSummary.countNegative": countNegative,
        "ratingSummary.totalCount": totalCount,
        "ratingSummary.score": score,
      }
    );
  }

  /**
   * Lấy thống kê đánh giá cho một user
   * @param {string} userId - ID user
   * @returns {Object} { countPositive, countNegative, totalCount, score }
   */
  async getUserRatingStats(userId) {
    const user = await User.findById(userId).select("ratingSummary");
    return (
      user?.ratingSummary || {
        countPositive: 0,
        countNegative: 0,
        totalCount: 0,
        score: 0,
      }
    );
  }
}

export const ratingService = new RatingService();
