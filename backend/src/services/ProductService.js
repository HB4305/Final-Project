/**
 * ============================================
 * PRODUCT SERVICE - Xử lý logic kinh doanh sản phẩm
 * API 1.1, 1.2, 1.3, 1.4, 1.5
 * ============================================
 */

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import { AppError } from "../utils/errors.js";
import mongoose from "mongoose";

export class ProductService {
  /**
   * API 1.1: Lấy tất cả sản phẩm (không lọc danh mục, có phân trang)
   * OPTIMIZED: Sử dụng Auction-First approach để tận dụng index
   */
  async getAllProducts(
    page = 1,
    limit = 12,
    sortBy = "newest",
    status = "active"
  ) {
    try {
      const skip = (page - 1) * limit;

      // Xác định sort order cho aggregation stage
      let sortStage = { createdAt: -1 };
      if (sortBy === "price_asc") sortStage = { currentPrice: 1 };
      if (sortBy === "price_desc") sortStage = { currentPrice: -1 };
      if (sortBy === "ending_soon") sortStage = { endAt: 1 };
      if (sortBy === "most_bids") sortStage = { bidCount: -1 };

      console.log(
        `[PRODUCT SERVICE] getAllProducts (Aggregation) - Sort: ${JSON.stringify(
          sortStage
        )}`
      );

      const pipeline = [
        // 1. Match active auctions
        { $match: { status: status } },
        
        // 2. Lookup existing product
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        
        // 3. Unwind product and filter only active products
        { $unwind: "$product" },
        { $match: { "product.isActive": true } },
        
        // 4. Sort
        { $sort: sortStage },
        
        // 5. Facet for data and total count
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: parseInt(limit) },
              // 6. Project and lookup additional fields
              {
                $lookup: {
                  from: "users",
                  localField: "sellerId",
                  foreignField: "_id",
                  as: "seller",
                },
              },
              { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "users",
                  localField: "currentHighestBidderId",
                  foreignField: "_id",
                  as: "bidder",
                },
              },
              { $unwind: { path: "$bidder", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "categories",
                  localField: "product.categoryId",
                  foreignField: "_id",
                  as: "category",
                },
              },
              { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  _id: "$product._id",
                  title: "$product.title",
                  slug: "$product.slug",
                  primaryImageUrl: "$product.primaryImageUrl",
                  createdAt: "$product.createdAt",
                  auction: {
                    _id: "$_id",
                    currentPrice: "$currentPrice",
                    bidCount: "$bidCount",
                    endAt: "$endAt",
                    startPrice: "$startPrice",
                    buyNowPrice: "$buyNowPrice",
                    currentHighestBidder: "$bidder.username",
                    status: "$status",
                  },
                  seller: {
                    _id: "$seller._id",
                    username: "$seller.username",
                    ratingSummary: "$seller.ratingSummary",
                    rating: {
                      $cond: [
                        { $ifNull: ["$seller.ratingSummary.score", false] },
                        { $multiply: ["$seller.ratingSummary.score", 5] },
                        null
                      ]
                    }
                  },
                  category: {
                    _id: "$category._id",
                    name: "$category.name",
                  },
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ];

      const result = await Auction.aggregate(pipeline);
      const products = result[0].data;
      const total = result[0].total[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          limit: parseInt(limit),
        },
      };
    } catch (error) {
      console.error("[PRODUCT SERVICE] Lỗi getAllProducts:", error);
      throw error;
    }
  }

  /**
   * API 1.2: Lấy Top 5 sản phẩm cho Homepage
   * - Top 5 sắp kết thúc (endAt soonest)
   * - Top 5 có nhiều bids nhất
   * - Top 5 có giá cao nhất
   */
  async getTopProducts() {
    try {
      console.log("[PRODUCT SERVICE] Lấy Top 5 sản phẩm cho Homepage");

      // Execute queries in parallel
      const [endingSoon, mostBids, highestPrice] = await Promise.all([
        // Top 10 gần kết thúc (To ensure 5 valid ones after filtering)
        Auction.find({ status: "active" })
          .sort({ endAt: 1 })
          .limit(10)
          .populate({
            path: "productId",
            select: "title primaryImageUrl",
          })
          .populate({
            path: "currentHighestBidderId",
            select: "username",
          })
          .select("_id currentPrice bidCount endAt")
          .lean(),

        // Top 10 nhiều bids nhất
        Auction.find({ status: "active" })
          .sort({ bidCount: -1 })
          .limit(10)
          .populate({
            path: "productId",
            select: "title primaryImageUrl",
          })
          .populate({
            path: "currentHighestBidderId",
            select: "username",
          })
          .select("_id currentPrice bidCount endAt")
          .lean(),

        // Top 10 giá cao nhất
        Auction.find({ status: "active" })
          .sort({ currentPrice: -1 })
          .limit(10)
          .populate({
            path: "productId",
            select: "title primaryImageUrl",
          })
          .populate({
            path: "currentHighestBidderId",
            select: "username",
          })
          .select("_id currentPrice bidCount endAt")
          .lean(),
      ]);

      console.log("[PRODUCT SERVICE] Top products fetched successfully");

      return {
        endingSoon: this._formatTopProducts(endingSoon),
        mostBids: this._formatTopProducts(mostBids),
        highestPrice: this._formatTopProducts(highestPrice),
      };
    } catch (error) {
      console.error("[PRODUCT SERVICE] Lỗi khi lấy top products:", error);
      throw error;
    }
  }

  /**
   * API 1.3: Lấy danh sách sản phẩm theo danh mục (có phân trang)
   * @param {String} categoryId - ID danh mục
   * @param {Number} page - Trang hiện tại
   * @param {Number} limit - Số sản phẩm trên 1 trang
   * @param {String} sortBy - Cách sắp xếp (newest, price_asc, price_desc, ending_soon, most_bids)
   */
  /**
   * API 1.3: Lấy danh sách sản phẩm theo danh mục (phân trang)
   * Hỗ trợ sắp xếp theo: newest, price_asc, price_desc, ending_soon, most_bids
   */
  async getProductsByCategory(
    categoryId,
    page = 1,
    limit = 12,
    sortBy = "newest"
  ) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new AppError("Danh mục không tồn tại", 404, "CATEGORY_NOT_FOUND");
      }
      console.log(
        "[PRODUCT SERVICE] Category found:",
        category.name,
        "Level:",
        category.level
      );

      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

      // FIX: If parent category (level 1), get all child categories
      let categoryIds = [categoryObjectId];
      if (category.level === 1) {
        console.log(
          "[PRODUCT SERVICE] Parent category detected, finding child categories..."
        );
        const childCategories = await Category.find({
          parentId: categoryObjectId,
        });
        console.log(
          "[PRODUCT SERVICE] Found",
          childCategories.length,
          "child categories"
        );
        categoryIds = childCategories.map(
          (cat) => new mongoose.Types.ObjectId(cat._id)
        );
        categoryIds.unshift(categoryObjectId);
      }

      const skip = (page - 1) * limit;

      let sortStage = { createdAt: -1 };
      if (sortBy === "price_asc") sortStage = { "auction.currentPrice": 1 };
      if (sortBy === "price_desc") sortStage = { "auction.currentPrice": -1 };
      if (sortBy === "ending_soon") sortStage = { "auction.endAt": 1 };
      if (sortBy === "most_bids") sortStage = { "auction.bidCount": -1 };

      const pipeline = [
        // Stage 1: Match products in category (or child categories if parent)
        {
          $match: {
            categoryId: { $in: categoryIds },
            isActive: true,
          },
        },
        // Stage 2: Lookup auction
        {
          $lookup: {
            from: "auctions",
            localField: "_id",
            foreignField: "productId",
            as: "auction",
          },
        },
        // Stage 3: Unwind auction (only active auctions)
        {
          $unwind: {
            path: "$auction",
            preserveNullAndEmptyArrays: false,
          },
        },
        // Stage 4: Match only active auctions
        {
          $match: {
            "auction.status": "active",
          },
        },
        // Stage 5: Sort
        {
          $sort: sortStage,
        },
        // Stage 6: Skip
        {
          $skip: skip,
        },
        // Stage 7: Limit
        {
          $limit: parseInt(limit),
        },
        // Stage 8: Lookup highest bidder username for this auction
        {
          $lookup: {
            from: "users",
            localField: "auction.currentHighestBidderId",
            foreignField: "_id",
            as: "auction_highestBidder",
          },
        },
        // Stage 9: Lookup seller info so we can expose seller rating in search results
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "seller",
          },
        },
        // Stage 10: Unwind seller
        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Stage 11: Project fields
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            primaryImageUrl: 1,
            // imageUrls removed for optimization
            createdAt: 1,
            auction: {
              _id: "$auction._id",
              currentPrice: "$auction.currentPrice",
              bidCount: "$auction.bidCount",
              endAt: "$auction.endAt",
              startPrice: "$auction.startPrice",
              buyNowPrice: "$auction.buyNowPrice",
              currentHighestBidder: {
                $arrayElemAt: ["$auction_highestBidder.username", 0],
              },
              status: "$auction.status",
            },
            seller: {
              _id: "$seller._id",
              username: "$seller.username",
              ratingSummary: "$seller.ratingSummary",
              rating: {
                $cond: [
                  { $ifNull: ["$seller.ratingSummary.score", false] },
                  {
                    $round: [
                      { $multiply: ["$seller.ratingSummary.score", 5] },
                      1,
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
      ];

      // FIX: Execute aggregation
      console.log("[PRODUCT SERVICE] Executing aggregation pipeline...");
      const products = await Product.aggregate(pipeline);
      console.log(
        "[PRODUCT SERVICE] ✅ Aggregation done, found:",
        products.length
      );

      // FIX: Get total count - chỉ count products có auction active
      console.log("[PRODUCT SERVICE] Counting total...");
      const totalPipeline = [
        {
          $match: {
            categoryId: { $in: categoryIds },
            isActive: true,
          },
        },
        {
          $lookup: {
            from: "auctions",
            localField: "_id",
            foreignField: "productId",
            as: "auction",
          },
        },
        {
          $unwind: {
            path: "$auction",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: {
            "auction.status": "active",
          },
        },
        {
          $count: "total",
        },
      ];

      const totalResult = await Product.aggregate(totalPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      console.log(
        `[PRODUCT SERVICE] ✅ API 1.3 complete - Found ${products.length} products, total: ${total}`
      );

      return {
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error(
        "[PRODUCT SERVICE] Lỗi khi lấy sản phẩm theo danh mục:",
        error
      );
      throw error;
    }
  }

  /**
   * API 1.4: Full-text search sản phẩm (API nặng)
   * Hỗ trợ:
   * - Tìm kiếm theo tên sản phẩm
   * - Lọc theo danh mục
   * - Lọc theo khoảng giá
   * - Sắp xếp theo giá, thời gian kết thúc, số bids
   *
   * @param {String} searchQuery - Từ khóa tìm kiếm
   * @param {Object} filters - Các bộ lọc (categoryId, minPrice, maxPrice, sortBy)
   * @param {Number} page - Trang hiện tại
   * @param {Number} limit - Số sản phẩm trên 1 trang
   */
  async searchProducts(searchQuery, filters = {}, page = 1, limit = 12) {
    try {
      console.log(`[PRODUCT SERVICE] Tìm kiếm sản phẩm: "${searchQuery}"`);

      const skip = (page - 1) * limit;
      let query = { isActive: true };

      // Full-text search - yêu cầu text index trên trường title
      if (searchQuery && searchQuery.trim()) {
        query.$text = { $search: searchQuery };
      }

      // Lọc theo danh mục
      if (filters.categoryId) {
        query.categoryId = filters.categoryId;
      }

      // Xác định sắp xếp
      let sortQuery = { _id: -1 };
      if (filters.sortBy === "price_asc")
        sortQuery = { "auction.currentPrice": 1 };
      if (filters.sortBy === "price_desc")
        sortQuery = { "auction.currentPrice": -1 };
      if (filters.sortBy === "ending_soon") sortQuery = { "auction.endAt": 1 };
      if (filters.sortBy === "most_bids")
        sortQuery = { "auction.bidCount": -1 };

      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: "auctions",
            localField: "_id",
            foreignField: "productId",
            as: "auction",
          },
        },
        { $unwind: "$auction" },
        { $match: { "auction.status": "active" } },

        // Lọc theo khoảng giá (nếu có)
        ...(filters.minPrice || filters.maxPrice
          ? [
              {
                $match: {
                  ...(filters.minPrice && {
                    "auction.currentPrice": { $gte: filters.minPrice },
                  }),
                  ...(filters.maxPrice && {
                    "auction.currentPrice": { $lte: filters.maxPrice },
                  }),
                },
              },
            ]
          : []),

        { $sort: sortQuery },
        { $skip: skip },
        { $limit: limit },

        // Lookup highest bidder username for this auction
        {
          $lookup: {
            from: "users",
            localField: "auction.currentHighestBidderId",
            foreignField: "_id",
            as: "auction_highestBidder",
          },
        },
        // Lookup seller
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,
            title: 1,
            primaryImageUrl: 1,
            auction: {
              _id: "$auction._id",
              currentPrice: "$auction.currentPrice",
              bidCount: "$auction.bidCount",
              endAt: "$auction.endAt",
              buyNowPrice: "$auction.buyNowPrice",
              startPrice: "$auction.startPrice",
              currentHighestBidder: {
                $arrayElemAt: ["$auction_highestBidder.username", 0],
              },
              status: "$auction.status",
            },
            seller: {
              _id: "$seller._id",
              username: "$seller.username",
              ratingSummary: "$seller.ratingSummary",
              rating: {
                $cond: [
                  { $ifNull: ["$seller.ratingSummary.score", false] },
                  {
                    $round: [
                      { $multiply: ["$seller.ratingSummary.score", 5] },
                      1,
                    ],
                  },
                  null,
                ],
              },
            },
            ...(searchQuery && { score: { $meta: "textScore" } }),
          },
        },
      ];

      // Nếu có text search, sắp xếp lại theo relevance score
      if (searchQuery && searchQuery.trim()) {
        pipeline.push({ $sort: { score: -1 } });
      }

      // Đếm tổng số sản phẩm từ aggregation pipeline (để khớp với dữ liệu thực tế)
      const countPipeline = [
        { $match: query },
        {
          $lookup: {
            from: "auctions",
            localField: "_id",
            foreignField: "productId",
            as: "auction",
          },
        },
        { $unwind: "$auction" },
        { $match: { "auction.status": "active" } },

        // Lọc theo khoảng giá (phải khớp với pipeline lấy dữ liệu)
        ...(filters.minPrice || filters.maxPrice
          ? [
              {
                $match: {
                  ...(filters.minPrice && {
                    "auction.currentPrice": { $gte: filters.minPrice },
                  }),
                  ...(filters.maxPrice && {
                    "auction.currentPrice": { $lte: filters.maxPrice },
                  }),
                },
              },
            ]
          : []),

        { $count: "total" },
      ];

      const products = await Product.aggregate(pipeline);
      const totalResult = await Product.aggregate(countPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      console.log(
        `[PRODUCT SERVICE] Tìm kiếm hoàn tất, tìm được ${products.length}/${total} kết quả`
      );

      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        query: searchQuery,
      };
    } catch (error) {
      console.error("[PRODUCT SERVICE] Lỗi khi tìm kiếm sản phẩm:", error);
      throw error;
    }
  }

  /**
   * API 1.5: Lấy chi tiết sản phẩm (đầy đủ thông tin)
   * Bao gồm:
   * - Thông tin sản phẩm (tiêu đề, ảnh, mô tả, metadata)
   * - Thông tin người bán
   * - Thông tin phiên đấu giá hiện tại (giá, số bids, thời gian còn lại)
   * - Top 5 bidders gần đây
   * - 5 sản phẩm cùng danh mục (related products)
   *
   * @param {String} productId - ID sản phẩm
   */
  async getProductDetail(productId) {
    try {
      console.log(`[PRODUCT SERVICE] Lấy chi tiết sản phẩm: ${productId}`);

      const product = await Product.findById(productId)
        .populate("categoryId", "name slug")
        .populate("sellerId", "username email profileImageUrl ratingSummary");

      if (!product) {
        throw new AppError("Sản phẩm không tồn tại", 404, "PRODUCT_NOT_FOUND");
      }

      // Chuyển sang plain object
      const productObj = product.toObject ? product.toObject() : product;

      // Lấy thông tin phiên đấu giá hiện tại
      const auction = await Auction.findOne({ productId: productId })
        .select(
          "_id currentPrice bidCount startAt endAt startPrice priceStep buyNowPrice autoExtendEnabled currentHighestBidderId status"
        )
        .lean();

      if (!auction) {
        throw new AppError(
          "Phiên đấu giá không tồn tại",
          404,
          "AUCTION_NOT_FOUND"
        );
      }

      // Tính thời gian còn lại (ms)
      const timeRemaining = new Date(auction.endAt) - new Date();
      const isAuctionActive = timeRemaining > 0 && auction.status === "active";

      // Lấy tất cả bidders
      const topBidders = await Bid.find({ auctionId: auction._id })
        .sort({ amount: -1, createdAt: -1 })
        .populate("bidderId", "username ratingSummary")
        .select("amount createdAt bidderId")
        .lean();

      const formattedBidders = topBidders.map((bid) => ({
        amount: bid.amount,
        bidderUsername: bid.bidderId?.username || "Unknown",
        bidderRating: bid.bidderId?.ratingSummary?.score || 0,
        createdAt: bid.createdAt,
      }));

      const categoryIdRef = productObj.categoryId?._id || productObj.categoryId;

      const relatedProducts = await Product.aggregate([
        {
          $match: {
            categoryId: categoryIdRef,
            _id: { $ne: product._id },
            isActive: true,
          },
        },
        { $limit: 5 },
        {
          $lookup: {
            from: "auctions",
            localField: "_id",
            foreignField: "productId",
            as: "auction",
          },
        },
        { $unwind: { path: "$auction", preserveNullAndEmptyArrays: true } },
        { $match: { "auction.status": "active" } },
        {
          $project: {
            _id: 1,
            title: 1,
            primaryImageUrl: 1,
            "auction._id": 1,
            "auction.currentPrice": 1,
            "auction.bidCount": 1,
            "auction.endAt": 1,
          },
        },
      ]);

      console.log(`[PRODUCT SERVICE] Chi tiết sản phẩm lấy thành công`);

      // Normalize seller rating (0..5) for frontend convenience
      if (
        productObj.sellerId &&
        productObj.sellerId.ratingSummary &&
        typeof productObj.sellerId.ratingSummary.score === "number"
      ) {
        productObj.sellerId.rating =
          Math.round(productObj.sellerId.ratingSummary.score * 5 * 10) / 10; // one decimal
      } else {
        productObj.sellerId = productObj.sellerId || {};
        productObj.sellerId.rating = productObj.sellerId.rating || null;
      }

      return {
        product: {
          ...productObj,
          auction: {
            ...auction,
            timeRemaining: Math.max(0, timeRemaining),
            isActive: isAuctionActive,
            topBidders: formattedBidders,
          },
        },
        relatedProducts: relatedProducts.map((p) => ({
          _id: p._id,
          title: p.title,
          primaryImageUrl: p.primaryImageUrl,
          auction: {
            _id: p.auction?._id,
            currentPrice: p.auction?.currentPrice,
            bidCount: p.auction?.bidCount,
            endAt: p.auction?.endAt,
            timeRemaining: p.auction
              ? new Date(p.auction.endAt) - new Date()
              : 0,
          },
        })),
      };
    } catch (error) {
      console.error("[PRODUCT SERVICE] Lỗi khi lấy chi tiết sản phẩm:", error);
      throw error;
    }
  }

  /**
   * Helper: Format danh sách top products để hiển thị
   */
  _formatTopProducts(auctions) {
    return auctions
      .filter((auction) => auction.productId) // Only include auctions with valid products
      .slice(0, 5) // Always return exactly 5 (or less if not enough)
      .map((auction) => ({
        auctionId: auction._id,
        product: {
          productId: auction.productId?._id || auction.productId,
          title: auction.productId?.title,
          image: auction.productId?.primaryImageUrl,
        },
        currentPrice: auction.currentPrice,
        bidCount: auction.bidCount,
        endAt: auction.endAt,
        timeRemaining: new Date(auction.endAt) - new Date(),
        currentHighestBidder:
          auction.currentHighestBidderId?.username || "Chưa có bidder",
      }));
  }
}

export const productService = new ProductService();
