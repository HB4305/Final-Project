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
  async getUserRatingSummary(userId) {
    const user = await User.findById(userId).select(
      "ratingSummary username fullName"
    );

    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return {
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
      ratingSummary: user.ratingSummary,
    };
  }

  /**
   * Lấy danh sách đánh giá chi tiết của user
   * @param {string} userId - ID của user
   * @param {Object} options - { page, limit, context }
   * @returns {Object} { ratings, pagination }
   */
  async getUserRatings(userId, options = {}) {
    const { page = 1, limit = 10, context } = options;
    const skip = (page - 1) * limit;

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Build query
    const query = { rateeId: userId };
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
   * @param {string} userId - ID của user
   * @returns {Object} Full profile info
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId).select("-passwordHash -otp");

    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Lấy một số ratings gần nhất
    const recentRatings = await Rating.find({ rateeId: userId })
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
