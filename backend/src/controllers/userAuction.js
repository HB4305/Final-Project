// CONTROLLER: User Auction Activity

import mongoose from 'mongoose';
import Bid from "../models/Bid.js";
import Auction from "../models/Auction.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Rating from "../models/Rating.js";
import Watchlist from "../models/Watchlist.js";
import { AppError } from "../utils/errors.js";

/**
 * GET /api/user/auctions/stats
 * Lấy thống kê số lượng cho dashboard
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [activeBidsCount, wonCount, sellingCount, soldCount, watchlistCount] =
      await Promise.all([
        // participating: auctions user bid on that are active/pending
        (async () => {
          const userBids = await Bid.find({ bidderId: userId }).distinct(
            "auctionId"
          );
          if (!userBids.length) return 0;
          return Auction.countDocuments({
            _id: { $in: userBids },
            status: { $in: ["active", "pending"] },
          });
        })(),
        // won: auctions user won
        Auction.countDocuments({
          currentHighestBidderId: userId,
          status: "ended",
        }),
        // selling: auctions user is selling (active/pending)
        Auction.countDocuments({
          sellerId: userId,
          status: { $in: ["active", "pending"] },
        }),
        // sold: auctions user sold
        Auction.countDocuments({
          sellerId: userId,
          status: "ended",
          currentHighestBidderId: { $exists: true, $ne: null },
        }),
        // watchlist: items in watchlist
        Watchlist.countDocuments({ userId: userId }),
      ]);

    res.status(200).json({
      status: "success",
      data: {
        activeBids: activeBidsCount,
        wonCount,
        sellingCount,
        soldCount,
        watchlistCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    // Optimized: Fetch highest bids for all auctions in one query using Aggregation
    const auctionIds = auctions.map((a) => a._id);

    const highestBids = await Bid.aggregate([
      {
        $match: {
          auctionId: { $in: auctionIds },
          bidderId: req.user._id,
        },
      },
      { $sort: { amount: -1 } },
      {
        $group: {
          _id: "$auctionId",
          amount: { $first: "$amount" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    // Create a map for O(1) lookup
    const bidMap = {};
    highestBids.forEach((bid) => {
      bidMap[bid._id.toString()] = {
        amount: bid.amount,
        createdAt: bid.createdAt,
      };
    });

    const auctionsWithUserBid = auctions.map((auction) => {
      return {
        ...auction,
        userHighestBid: bidMap[auction._id.toString()] || null,
        isWinning:
          (
            auction.currentHighestBidderId?._id ||
            auction.currentHighestBidderId
          )?.toString() === req.user._id.toString(),
      };
    });

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
 * Optimized: Uses Aggregation to fetch Auction + Order + Rating status in one go
 */
export const getWonAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const pipeline = [
      // 1. Match Won Auctions
      {
        $match: {
          currentHighestBidderId: userId,
          status: "ended",
        },
      },
      // 2. Sort by End Date
      { $sort: { endAt: -1 } },
      // 3. Facet for Pagination & Data
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limitNum },
            // Lookup Product
            {
              $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product",
                pipeline: [
                   { $project: { title: 1, slug: 1, primaryImageUrl: 1, categoryId: 1 } }
                ]
              },
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            // Lookup Seller
            {
              $lookup: {
                from: "users",
                localField: "sellerId",
                foreignField: "_id",
                as: "seller",
                pipeline: [{ $project: { username: 1, fullName: 1, ratingSummary: 1 } }]
              },
            },
            { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
             // Lookup Order (to check transaction status)
            {
              $lookup: {
                from: "orders",
                localField: "_id",
                foreignField: "auctionId",
                as: "order"
              }
            },
            { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
            // Lookup Rating (did I rate this order?)
            {
              $lookup: {
                from: "ratings",
                let: { orderId: "$order._id" },
                pipeline: [
                  { 
                    $match: { 
                      $expr: { 
                        $and: [
                           { $eq: ["$orderId", "$$orderId"] },
                           { $eq: ["$raterId", userId] },
                           { $eq: ["$context", "nguoi_mua_danh_gia"] }
                        ]
                      } 
                    } 
                  },
                  { $limit: 1 }
                ],
                as: "userRating"
              }
            },
            // Project final shape
            {
              $project: {
                _id: 1,
                currentPrice: 1,
                endAt: 1,
                status: 1,
                productId: "$product",
                sellerId: "$seller",
                orderId: "$order._id",
                transactionStatus: { $ifNull: ["$order.status", "pending"] },
                isRated: { $gt: [{ $size: "$userRating" }, 0] }
              }
            }
          ],
        },
      },
    ];

    const [result] = await Auction.aggregate(pipeline);
    
    const auctions = result.data || [];
    const total = result.metadata[0]?.total || 0;

    res.status(200).json({
      status: "success",
      data: {
        auctions,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
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
          select:
            "title slug primaryImageUrl categoryId descriptionHistory metadata requireBidderApproval approvedBidders",
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
 * Optimized: Uses Aggregation
 */
export const getSoldAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const pipeline = [
      // Match Sold Auctions (Ended + Has Bidder (+ Seller is me))
      {
        $match: {
          sellerId: userId,
          status: "ended",
          currentHighestBidderId: { $exists: true, $ne: null }
        }
      },
      // Sort by endAt descending
      { $sort: { endAt: -1 } },
      // Facet
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limitNum },
            // Lookup Product
            {
               $lookup: {
                  from: "products",
                  localField: "productId",
                  foreignField: "_id",
                  as: "product",
                  pipeline: [{ $project: { title: 1, slug: 1, primaryImageUrl: 1, categoryId: 1 } }]
               }
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            // Lookup Winner (Bidder)
            {
               $lookup: {
                  from: "users",
                  localField: "currentHighestBidderId",
                  foreignField: "_id",
                  as: "winner",
                  pipeline: [{ $project: { username: 1, fullName: 1, ratingSummary: 1 } }]
               }
            },
            { $unwind: { path: "$winner", preserveNullAndEmptyArrays: true } },
            // Lookup Order
            {
              $lookup: {
                from: "orders",
                localField: "_id",
                foreignField: "auctionId",
                as: "order"
              }
            },
            { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
            // Lookup Rating (did I rate the WINNER?) context: nguoi_ban_danh_gia
            {
              $lookup: {
                from: "ratings",
                let: { orderId: "$order._id" },
                pipeline: [
                  { 
                    $match: { 
                      $expr: { 
                        $and: [
                           { $eq: ["$orderId", "$$orderId"] },
                           { $eq: ["$raterId", userId] },
                           { $eq: ["$context", "nguoi_ban_danh_gia"] }
                        ]
                      } 
                    } 
                  },
                  { $limit: 1 }
                ],
                as: "userRating"
              }
            },
            // Project
            {
               $project: {
                  _id: 1,
                  currentPrice: 1,
                  endAt: 1,
                  status: 1,
                  bidCount: 1,
                  productId: "$product",
                  winnerId: "$winner", // mapped to currentHighestBidderId in frontend usually, but here we explicitly send winner object
                  currentHighestBidderId: "$winner", // maintain compat
                  orderId: "$order._id",
                  transactionStatus: { $ifNull: ["$order.status", "pending"] },
                  isRated: { $gt: [{ $size: "$userRating" }, 0] }
               }
            }
          ]
        }
      }
    ];

    const [result] = await Auction.aggregate(pipeline);

    const auctions = result.data || [];
    const total = result.metadata[0]?.total || 0;

    res.status(200).json({
      status: "success",
      data: {
        auctions,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
