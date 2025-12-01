// CONTROLLER: User Auction Activity

import Bid from "../models/Bid.js";
import Auction from "../models/Auction.js";
import Product from "../models/Product.js";
import { AppError } from "../utils/errors.js";

/**
 * GET /api/user/auctions/participating
 * Lấy danh sách sản phẩm mà user đang tham gia đấu giá
 */
export const getParticipatingAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Lấy các auction mà user đã đặt giá
    const userBids = await Bid.find({ bidderId: req.user._id }).distinct(
      "auctionId"
    );

    // Lấy thông tin auction còn active
    const [auctions, total] = await Promise.all([
      Auction.find({
        _id: { $in: userBids },
        status: { $in: ["active", "pending"] },
      })
        .sort({ endAt: 1 }) // Sắp xếp theo thời gian kết thúc
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: "productId",
          select: "title slug primaryImageUrl categoryId",
          populate: { path: "categoryId", select: "name slug" },
        })
        .populate("currentHighestBidderId", "username fullName")
        .lean(),
      Auction.countDocuments({
        _id: { $in: userBids },
        status: { $in: ["active", "pending"] },
      }),
    ]);

    // Lấy bid cao nhất của user cho mỗi auction
    const auctionsWithUserBid = await Promise.all(
      auctions.map(async (auction) => {
        const userHighestBid = await Bid.findOne({
          auctionId: auction._id,
          bidderId: req.user._id,
        })
          .sort({ amount: -1 })
          .select("amount createdAt")
          .lean();

        return {
          ...auction,
          userHighestBid,
          isWinning:
            auction.currentHighestBidderId?.toString() ===
            req.user._id.toString(),
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        auctions: auctionsWithUserBid,
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
 * GET /api/user/auctions/won
 * Lấy danh sách sản phẩm mà user đã thắng đấu giá
 */
export const getWonAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      winnerId: req.user._id,
      status: "completed",
    };

    // Nếu có filter theo trạng thái giao dịch
    if (status) {
      query.transactionStatus = status;
    }

    const [auctions, total] = await Promise.all([
      Auction.find(query)
        .sort({ endedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: "productId",
          select: "title slug primaryImageUrl categoryId",
          populate: { path: "categoryId", select: "name slug" },
        })
        .populate(
          "sellerId",
          "username fullName contactPhone email ratingSummary"
        )
        .lean(),
      Auction.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        auctions,
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
 * GET /api/user/auctions/selling
 * Lấy danh sách sản phẩm mà user đang đăng bán (còn hạn)
 */
export const getSellingAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [auctions, total] = await Promise.all([
      Auction.find({
        sellerId: req.user._id,
        status: { $in: ["active", "pending"] },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: "productId",
          select: "title slug primaryImageUrl categoryId",
        })
        .populate("currentHighestBidderId", "username fullName ratingSummary")
        .lean(),
      Auction.countDocuments({
        sellerId: req.user._id,
        status: { $in: ["active", "pending"] },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        auctions,
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
 * GET /api/user/auctions/sold
 * Lấy danh sách sản phẩm đã bán (có người thắng đấu giá)
 */
export const getSoldAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      sellerId: req.user._id,
      status: "completed",
      winnerId: { $exists: true, $ne: null },
    };

    if (status) {
      query.transactionStatus = status;
    }

    const [auctions, total] = await Promise.all([
      Auction.find(query)
        .sort({ endedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: "productId",
          select: "title slug primaryImageUrl categoryId",
        })
        .populate(
          "winnerId",
          "username fullName contactPhone email ratingSummary"
        )
        .lean(),
      Auction.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        auctions,
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
