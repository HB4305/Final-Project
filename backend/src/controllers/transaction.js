// CONTROLLER: Transaction Management

import Auction from "../models/Auction.js";
import Rating from "../models/Rating.js";
import User from "../models/User.js";
import { AppError } from "../utils/errors.js";

/**
 * POST /api/transactions/:auctionId/cancel
 * Seller hủy giao dịch và tự động đánh giá người thắng -1
 * Đoạn nhận xét: "Người thắng không thanh toán"
 */
export const cancelTransaction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { reason } = req.body;

    // Lấy thông tin auction
    const auction = await Auction.findById(auctionId)
      .populate("winnerId", "username fullName ratingSummary")
      .populate("productId", "title");

    if (!auction) {
      throw new AppError("Auction không tồn tại", 404);
    }

    // Kiểm tra quyền: chỉ seller mới được hủy
    if (auction.sellerId.toString() !== req.user._id.toString()) {
      throw new AppError("Bạn không có quyền hủy giao dịch này", 403);
    }

    // Kiểm tra trạng thái auction
    if (auction.status !== "completed") {
      throw new AppError("Chỉ có thể hủy auction đã kết thúc", 400);
    }

    // Kiểm tra có người thắng không
    if (!auction.winnerId) {
      throw new AppError("Auction này không có người thắng", 400);
    }

    // Kiểm tra trạng thái giao dịch
    if (auction.transactionStatus === "cancelled") {
      throw new AppError("Giao dịch đã bị hủy trước đó", 400);
    }

    if (["paid", "shipped", "delivered"].includes(auction.transactionStatus)) {
      throw new AppError(
        "Không thể hủy giao dịch đã thanh toán/giao hàng",
        400
      );
    }

    // Cập nhật trạng thái auction
    auction.transactionStatus = "cancelled";
    auction.updatedAt = Date.now();
    await auction.save();

    // Tự động tạo rating âm (-1) cho người thắng
    const defaultComment = reason || "Người thắng không thanh toán";

    const rating = await Rating.create({
      raterId: req.user._id, // seller đánh giá
      rateeId: auction.winnerId._id, // người thắng bị đánh giá
      auctionId: auction._id,
      productId: auction.productId._id,
      score: -1,
      comment: defaultComment,
      context: "seller_to_buyer",
    });

    // Cập nhật ratingSummary của người thắng
    const winner = await User.findById(auction.winnerId._id);
    winner.ratingSummary.countNegative += 1;
    winner.ratingSummary.totalCount += 1;
    winner.ratingSummary.score =
      winner.ratingSummary.totalCount > 0
        ? winner.ratingSummary.countPositive / winner.ratingSummary.totalCount
        : 0;
    await winner.save();

    res.status(200).json({
      status: "success",
      message: "Đã hủy giao dịch và tự động đánh giá người thắng (-1)",
      data: {
        auction,
        rating,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/transactions/:auctionId/status
 * Cập nhật trạng thái giao dịch
 */
export const updateTransactionStatus = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "paid",
      "shipped",
      "delivered",
      "cancelled",
      "disputed",
    ];
    if (!validStatuses.includes(status)) {
      throw new AppError("Trạng thái không hợp lệ", 400);
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      throw new AppError("Auction không tồn tại", 404);
    }

    // Kiểm tra quyền: seller hoặc winner
    const isAuthorized =
      auction.sellerId.toString() === req.user._id.toString() ||
      auction.winnerId?.toString() === req.user._id.toString();

    if (!isAuthorized) {
      throw new AppError("Bạn không có quyền cập nhật giao dịch này", 403);
    }

    auction.transactionStatus = status;
    auction.updatedAt = Date.now();
    await auction.save();

    res.status(200).json({
      status: "success",
      message: "Đã cập nhật trạng thái giao dịch",
      data: { auction },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/:auctionId
 * Lấy chi tiết giao dịch
 */
export const getTransactionDetail = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId)
      .populate("productId", "title slug primaryImageUrl imageUrls")
      .populate(
        "sellerId",
        "username fullName contactPhone email address ratingSummary"
      )
      .populate(
        "winnerId",
        "username fullName contactPhone email address ratingSummary"
      )
      .populate("winningBidId", "amount createdAt")
      .lean();

    if (!auction) {
      throw new AppError("Auction không tồn tại", 404);
    }

    // Kiểm tra quyền xem: seller, winner, hoặc admin
    const isAuthorized =
      auction.sellerId._id.toString() === req.user._id.toString() ||
      auction.winnerId?._id.toString() === req.user._id.toString() ||
      req.user.roles.includes("admin");

    if (!isAuthorized) {
      throw new AppError("Bạn không có quyền xem giao dịch này", 403);
    }

    // Lấy ratings liên quan
    const ratings = await Rating.find({ auctionId: auction._id })
      .populate("raterId", "username fullName")
      .populate("rateeId", "username fullName")
      .lean();

    res.status(200).json({
      status: "success",
      data: {
        auction,
        ratings,
      },
    });
  } catch (error) {
    next(error);
  }
};
