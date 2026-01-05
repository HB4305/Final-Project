// SERVICE: User Service

import { User } from "../models/index.js";
import Rating from "../models/Rating.js";
import { AppError } from "../utils/errors.js";
import { ERROR_CODES } from "../lib/constants.js";

export class UserService {
  /**
   * Lấy thông tin tổng quan đánh giá của user
   * @param {string} userId - ID của user
   * @returns {Object} Rating summary
   */
  /**
   * Resolve user ID from ID or Username
   * @private
   */
  async _resolveUserId(idOrUsername) {
    let query = {};
    const mongoose = (await import("mongoose")).default;
    
    if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
        query = { _id: idOrUsername };
    } else {
        query = { username: idOrUsername };
    }

    const user = await User.findOne(query).select("_id");
    if (!user) {
         throw new AppError(
            "Người dùng không tồn tại",
            404,
            ERROR_CODES.USER_NOT_FOUND
          );
    }
    return user._id;
  }

  /**
   * Lấy thông tin tổng quan đánh giá của user
   * @param {string} userId - ID hoặc username của user
   * @returns {Object} Rating summary
   */
  async getUserRatingSummary(userId) {
    const resolvedId = await this._resolveUserId(userId);
    const user = await User.findById(resolvedId).select(
      "ratingSummary username fullName"
    );

    return {
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
      ratingSummary: user.ratingSummary,
    };
  }

  /**
   * Lấy danh sách đánh giá chi tiết của user
   * @param {string} userId - ID hoặc username của user
   * @param {Object} options - { page, limit, context }
   * @returns {Object} { ratings, pagination }
   */
  async getUserRatings(userId, options = {}) {
    const resolvedId = await this._resolveUserId(userId);
    const { page = 1, limit = 10, context } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query = { rateeId: resolvedId };
    if (context) {
      query.context = context;
    }

    // Get ratings với populate thông tin người đánh giá
    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("raterId", "username fullName profileImageUrl")
        .populate("orderId", "productId")
        .lean(),
      Rating.countDocuments(query),
    ]);

    return {
      ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy thông tin profile đầy đủ của user (bao gồm ratings)
   * @param {string} userId - ID hoặc username của user
   * @returns {Object} Full profile info
   */
  async getUserProfile(userId) {
    const resolvedId = await this._resolveUserId(userId);
    const user = await User.findById(resolvedId).select("-passwordHash -otp");

    // Lấy một số ratings gần nhất
    const recentRatings = await Rating.find({ rateeId: resolvedId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("raterId", "username fullName profileImageUrl")
      .lean();

    return {
      user: user.toObject(),
      recentRatings,
    };
  }
}

export const userService = new UserService();
