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
    status = "active",
    filters = {}
  ) {
    try {
      const skip = (page - 1) * limit;

      const { minPrice, maxPrice, categoryId, search } = filters;

      // 1. Resolve Category IDs (including children if parent)
      let categoryIds = [];
      if (categoryId) {
        if (mongoose.Types.ObjectId.isValid(categoryId)) {
             const category = await Category.findById(categoryId);
             if (category) {
                 const catObjId = new mongoose.Types.ObjectId(categoryId);
                 categoryIds = [catObjId];
                 if (category.level === 1) {
                     const childCategories = await Category.find({ parentId: catObjId });
                     categoryIds = [...categoryIds, ...childCategories.map(c => c._id)];
                 }
             }
        }
      }

      // Xác định sort order cho aggregation stage
      let sortStage = { createdAt: -1 };
      if (sortBy === "price_asc") sortStage = { currentPrice: 1 };
      if (sortBy === "price_desc") sortStage = { currentPrice: -1 };
      if (sortBy === "ending_soon") sortStage = { endAt: 1 };
      if (sortBy === "most_bids") sortStage = { bidCount: -1 };

      // 1. Match Auction filters (Status + Price)
      let auctionMatch = { status: status };
      if (minPrice || maxPrice) {
          auctionMatch.currentPrice = {};
          if (minPrice) auctionMatch.currentPrice.$gte = parseInt(minPrice);
          if (maxPrice) auctionMatch.currentPrice.$lte = parseInt(maxPrice);
      }

      const pipeline = [
        // 1. Match active auctions (and price)
        { $match: auctionMatch },
        
        // 2. Lookup existing product
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        
        // 3. Unwind product and filter active products + Category + Search
        { $unwind: "$product" },
        { 
            $match: { 
                "product.isActive": true,
                ...(categoryIds.length > 0 && { "product.categoryId": { $in: categoryIds } }),
                ...(search && { "product.title": { $regex: search, $options: 'i' } })
            } 
        },
        
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

      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

      // FIX: If parent category (level 1), get all child categories
      let categoryIds = [categoryObjectId];
      if (category.level === 1) {
        const childCategories = await Category.find({
          parentId: categoryObjectId,
        });
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
      const products = await Product.aggregate(pipeline);

      // FIX: Get total count - chỉ count products có auction active
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
   * API 1.4: Full-text search sản phẩm (IMPROVED VERSION)
   * Hỗ trợ tìm kiếm đa tiêu chí:
   * - Tên sản phẩm (title)
   * - Mô tả (description)
   * - Tên danh mục (category name) ← MỚI
   * - Metadata (brand, model, condition)
   * - Lọc theo danh mục (bao gồm cả child categories)
   * - Lọc theo khoảng giá
   * - Sắp xếp linh hoạt
   *
   * @param {String} searchQuery - Từ khóa tìm kiếm
   * @param {Object} filters - Các bộ lọc (categoryId, minPrice, maxPrice, sortBy)
   * @param {Number} page - Trang hiện tại
   * @param {Number} limit - Số sản phẩm trên 1 trang
   */
  async searchProducts(searchQuery, filters = {}, page = 1, limit = 12) {
    try {

      const skip = (page - 1) * limit;
      const searchTerm = searchQuery?.trim().toLowerCase();

      // 1. SMART KEYWORD DETECTION - Phát hiện từ khóa đặc biệt
      let detectedSort = null;
      let actualSearchTerm = searchTerm; // Từ khóa thực để search sau khi loại bỏ keyword đặc biệt
      
      // Detect keywords nếu sortBy là relevance (mặc định) hoặc không có
      if (searchTerm && (!filters.sortBy || filters.sortBy === 'relevance')) {
        // Định nghĩa các từ khóa đặc biệt
        const keywordMap = {
          newest: ['mới nhất', 'mới', 'sản phẩm mới', 'vừa đăng', 'vừa lên'],
          ending_soon: ['sắp kết thúc', 'gần kết thúc', 'sắp hết hạn', 'sắp đóng'],
          most_bids: ['hot', 'nổi bật', 'nhiều lượt', 'nhiều người đấu', 'đấu giá nhiều', 'phổ biến'],
          price_desc: ['giá cao', 'đắt nhất', 'cao nhất', 'giá cao nhất'],
          price_asc: ['giá thấp', 'rẻ nhất', 'giá rẻ', 'thấp nhất', 'giá thấp nhất']
        };

        // Kiểm tra từng nhóm keyword
        for (const [sortType, keywords] of Object.entries(keywordMap)) {
          for (const keyword of keywords) {
            if (searchTerm.includes(keyword)) {
              detectedSort = sortType;
              // Loại bỏ keyword đặc biệt ra khỏi search term
              actualSearchTerm = searchTerm.replace(new RegExp(keyword, 'gi'), '').trim();
              break;
            }
          }
          if (detectedSort) break;
        }

        // Nếu chỉ gõ "đấu giá" hoặc "đang đấu giá" → return tất cả active auctions, sort mới nhất
        if (searchTerm.match(/^(đấu giá|đang đấu giá)$/i)) {
          detectedSort = 'newest';
          actualSearchTerm = ''; // Không search gì cả, chỉ filter active auctions
        }
      }

      // 2. Resolve categoryIds (including children if parent category)
      let categoryIds = [];
      if (filters.categoryId && mongoose.Types.ObjectId.isValid(filters.categoryId)) {
        const categoryObjId = new mongoose.Types.ObjectId(filters.categoryId);
        const category = await Category.findById(categoryObjId);
        
        if (category) {
          categoryIds = [categoryObjId];
          // Nếu là parent category (level 1), lấy tất cả child categories
          if (category.level === 1) {
            const childCategories = await Category.find({ parentId: categoryObjId });
            categoryIds = [...categoryIds, ...childCategories.map(c => c._id)];
          }
        }
      }

      // 3. Build initial match query
      let initialMatch = { isActive: true };

      // 4. Build regex pattern cho tiếng Việt
      let searchPattern = null;
      if (actualSearchTerm) {
        // Escape special regex characters và tách từ
        const words = actualSearchTerm.split(/\s+/).filter(w => w.length > 0);
        if (words.length > 0) {
          searchPattern = words.map(word => 
            word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          ).join('|'); // OR operator between words
        }
      }

      // 5. Xác định sort order (ưu tiên: detected keyword > user filter > default)
      let sortQuery = { _id: -1 };
      const finalSort = detectedSort || filters.sortBy || 'newest';
      
      if (finalSort === "price_asc") {
        sortQuery = { "auction.currentPrice": 1, _id: -1 };
      } else if (finalSort === "price_desc") {
        sortQuery = { "auction.currentPrice": -1, _id: -1 };
      } else if (finalSort === "ending_soon") {
        sortQuery = { "auction.endAt": 1, _id: -1 };
      } else if (finalSort === "most_bids") {
        sortQuery = { "auction.bidCount": -1, _id: -1 };
      } else if (finalSort === "newest") {
        sortQuery = { "createdAt": -1, _id: -1 };
      }

      // 5. Build main aggregation pipeline
      const pipeline = [
        // Stage 1: Initial match (active products)
        { $match: initialMatch },

        // Stage 2: Lookup category ĐỂ TÌM KIẾM THEO TÊN DANH MỤC
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

        // Stage 3: REGEX SEARCH cho title, description, category name, metadata
        ...(searchPattern ? [{
          $match: {
            $or: [
              { title: { $regex: searchPattern, $options: 'i' } },
              { 'descriptionHistory.text': { $regex: searchPattern, $options: 'i' } },
              { 'category.name': { $regex: searchPattern, $options: 'i' } }, // ← TÌM THEO TÊN DANH MỤC
              { 'metadata.brand': { $regex: searchPattern, $options: 'i' } },
              { 'metadata.model': { $regex: searchPattern, $options: 'i' } },
              { 'metadata.condition': { $regex: searchPattern, $options: 'i' } }
            ]
          }
        }] : []),

        // Stage 4: Lookup auction
        {
          $lookup: {
            from: "auctions",
            localField: "_id",
            foreignField: "productId",
            as: "auction",
          },
        },
        { $unwind: "$auction" },
        
        // Stage 5: Match active auctions
        { $match: { "auction.status": "active" } },

        // Stage 6: Filter by category (including children)
        ...(categoryIds.length > 0 ? [{
          $match: { categoryId: { $in: categoryIds } }
        }] : []),

        // Stage 7: Filter by price range
        ...(filters.minPrice || filters.maxPrice ? [{
          $match: {
            ...(filters.minPrice && {
              "auction.currentPrice": { $gte: parseInt(filters.minPrice) },
            }),
            ...(filters.maxPrice && {
              "auction.currentPrice": { $lte: parseInt(filters.maxPrice) },
            }),
          },
        }] : []),

        // Stage 8: Sort
        { $sort: sortQuery },

        // Stage 9: Pagination
        { $skip: skip },
        { $limit: parseInt(limit) },

        // Stage 10: Lookup bidder & seller
        {
          $lookup: {
            from: "users",
            localField: "auction.currentHighestBidderId",
            foreignField: "_id",
            as: "auction_highestBidder",
          },
        },
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

        // Stage 11: Project final fields
        {
          $project: {
            _id: 1,
            title: 1,
            primaryImageUrl: 1,
            createdAt: 1,
            category: {
              _id: "$category._id",
              name: "$category.name"
            },
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
          },
        },
      ];

      // 6. Count pipeline (khớp với main pipeline)
      const countPipeline = [
        { $match: initialMatch },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        
        ...(searchPattern ? [{
          $match: {
            $or: [
              { title: { $regex: searchPattern, $options: 'i' } },
              { 'descriptionHistory.text': { $regex: searchPattern, $options: 'i' } },
              { 'category.name': { $regex: searchPattern, $options: 'i' } },
              { 'metadata.brand': { $regex: searchPattern, $options: 'i' } },
              { 'metadata.model': { $regex: searchPattern, $options: 'i' } },
              { 'metadata.condition': { $regex: searchPattern, $options: 'i' } }
            ]
          }
        }] : []),

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

        ...(categoryIds.length > 0 ? [{
          $match: { categoryId: { $in: categoryIds } }
        }] : []),

        ...(filters.minPrice || filters.maxPrice ? [{
          $match: {
            ...(filters.minPrice && {
              "auction.currentPrice": { $gte: parseInt(filters.minPrice) },
            }),
            ...(filters.maxPrice && {
              "auction.currentPrice": { $lte: parseInt(filters.maxPrice) },
            }),
          },
        }] : []),

        { $count: "total" },
      ];

      // 7. Execute pipelines
      const [products, totalResult] = await Promise.all([
        Product.aggregate(pipeline),
        Product.aggregate(countPipeline)
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      if (products.length > 0) {
        console.log(`[PRODUCT SERVICE] Sample result:`, {
          title: products[0].title,
          category: products[0].category?.name
        });
      }

      return {
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        query: searchQuery,
        appliedFilters: {
          categoryIds: categoryIds.map(id => id.toString()),
          priceRange: {
            min: filters.minPrice || null,
            max: filters.maxPrice || null
          },
          sortBy: finalSort, // Hiển thị sort đã được detect hoặc user chọn
          detectedKeyword: detectedSort ? true : false // Flag để frontend biết có keyword đặc biệt
        }
      };
    } catch (error) {
      console.error("[PRODUCT SERVICE] Search error:", error);
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

      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { views: 1 } },
        { new: true }
      )
        .populate("categoryId", "name slug")
        .populate("sellerId", "username email profileImageUrl ratingSummary createdAt address");

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
        bidderId: bid.bidderId?._id,
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
   * Lấy thông tin đầy đủ của sản phẩm cho admin (tất cả fields của auction)
   */
  async getProductAdminDetails(productId) {
    try {
      console.log(`[PRODUCT SERVICE] Lấy chi tiết admin cho sản phẩm: ${productId}`);

      const product = await Product.findById(productId)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'username email fullName phoneNumber address profileImageUrl ratingSummary')
        .lean();

      if (!product) {
        throw new AppError('Sản phẩm không tồn tại', 404, 'PRODUCT_NOT_FOUND');
      }

      // Lấy tất cả thông tin auction
      const auction = await Auction.findOne({ productId: productId })
        .populate('currentHighestBidderId', 'username email')
        .lean();

      if (!auction) {
        throw new AppError('Phiên đấu giá không tồn tại', 404, 'AUCTION_NOT_FOUND');
      }

      // Lấy tất cả bids
      const bids = await Bid.find({ auctionId: auction._id })
        .sort({ amount: -1, createdAt: -1 })
        .populate('bidderId', 'username email ratingSummary')
        .lean();

      const formattedBids = bids.map(bid => ({
        _id: bid._id,
        amount: bid.amount,
        bidder: {
          _id: bid.bidderId?._id,
          username: bid.bidderId?.username,
          email: bid.bidderId?.email,
          rating: bid.bidderId?.ratingSummary?.score || 0
        },
        createdAt: bid.createdAt
      }));

      // Tính thời gian còn lại
      const timeRemaining = new Date(auction.endAt) - new Date();
      const isAuctionActive = timeRemaining > 0 && auction.status === 'active';

      return {
        product: {
          ...product,
          // Normalize seller rating
          sellerId: {
            ...product.sellerId,
            rating: product.sellerId?.ratingSummary?.score 
              ? Math.round((product.sellerId.ratingSummary.score * 5) * 10) / 10 
              : null
          }
        },
        auction: {
          ...auction,
          timeRemaining: Math.max(0, timeRemaining),
          isActive: isAuctionActive,
          // Thêm thông tin formatted
          autoExtendHistory: auction.autoExtendHistory || [],
          currentHighestBidder: auction.currentHighestBidderId ? {
            _id: auction.currentHighestBidderId._id,
            username: auction.currentHighestBidderId.username,
            email: auction.currentHighestBidderId.email
          } : null
        },
        bids: formattedBids,
        stats: {
          totalBids: bids.length,
          uniqueBidders: [...new Set(bids.map(b => b.bidderId?._id?.toString()))].length,
          averageBidAmount: bids.length > 0 
            ? bids.reduce((sum, b) => sum + b.amount, 0) / bids.length 
            : 0,
          highestBid: bids.length > 0 ? bids[0].amount : auction.startPrice
        }
      };
    } catch (error) {
      console.error('[PRODUCT SERVICE] Lỗi khi lấy chi tiết admin:', error);
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
