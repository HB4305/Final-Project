// CONTROLLER: Watchlist Management

import Watchlist from "../models/Watchlist.js";
import Product from "../models/Product.js";
import { AppError } from "../utils/errors.js";

/**
 * GET /api/watchlist
 * Lấy danh sách sản phẩm yêu thích của user hiện tại
 */
export const getUserWatchlist = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [watchlistItems, total] = await Promise.all([
      Watchlist.find({ userId: req.user._id })
        .sort({ watchedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: "productId",
          select: "title slug primaryImageUrl categoryId sellerId createdAt",
          populate: [
            { path: "categoryId", select: "name slug" },
            { path: "sellerId", select: "username fullName ratingSummary" },
          ],
        })
        .lean(),
      Watchlist.countDocuments({ userId: req.user._id }),
    ]);

    // Filter out any watchlist items where product was deleted
    const validItems = watchlistItems.filter((item) => item.productId);

    res.status(200).json({
      status: "success",
      data: {
        watchlist: validItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/watchlist/:productId
 * Thêm sản phẩm vào danh sách yêu thích
 */
export const addToWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Kiểm tra product tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }

    // Kiểm tra đã thêm chưa
    const existing = await Watchlist.findOne({
      userId: req.user._id,
      productId,
    });

    if (existing) {
      throw new AppError("Sản phẩm đã có trong danh sách yêu thích", 400);
    }

    // Thêm vào watchlist
    const watchlistItem = await Watchlist.create({
      userId: req.user._id,
      productId,
    });

    res.status(201).json({
      status: "success",
      message: "Đã thêm sản phẩm vào danh sách yêu thích",
      data: { watchlistItem },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/watchlist/:productId
 * Xoá sản phẩm khỏi danh sách yêu thích
 */
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await Watchlist.findOneAndDelete({
      userId: req.user._id,
      productId,
    });

    if (!result) {
      throw new AppError("Sản phẩm không có trong danh sách yêu thích", 404);
    }

    res.status(200).json({
      status: "success",
      message: "Đã xoá sản phẩm khỏi danh sách yêu thích",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/watchlist/check/:productId
 * Kiểm tra sản phẩm có trong watchlist không
 */
export const checkWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const exists = await Watchlist.exists({
      userId: req.user._id,
      productId,
    });

    res.status(200).json({
      status: "success",
      data: { isWatched: !!exists },
    });
  } catch (error) {
    next(error);
  }
};
