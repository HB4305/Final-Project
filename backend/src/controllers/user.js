// CONTROLLER: User Controller

import { userService } from "../services/UserService.js";

/**
 * Controller lấy rating summary của user
 */
export const getUserRatingSummary = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    const result = await userService.getUserRatingSummary(userId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy danh sách ratings chi tiết
 */
export const getUserRatings = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { page, limit, context } = req.query;

    const result = await userService.getUserRatings(userId, {
      page,
      limit,
      context,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy profile đầy đủ của user
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    const result = await userService.getUserProfile(userId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
