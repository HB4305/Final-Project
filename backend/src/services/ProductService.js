/**
 * ============================================
 * PRODUCT SERVICE - Xử lý logic kinh doanh sản phẩm
 * API 1.1, 1.2, 1.3, 1.4, 1.5
 * ============================================
 */

import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import { AppError } from '../utils/errors.js';
import mongoose from 'mongoose';

export class ProductService {

  /**
   * API 1.1: Lấy tất cả sản phẩm (không lọc danh mục, có phân trang)
   */
  async getAllProducts(page = 1, limit = 12, sortBy = 'newest', status = 'active') {
    try {

      const skip = (page - 1) * limit;

      // Xác định sort order
      let sortStage = { createdAt: -1 };
      if (sortBy === 'price_asc') sortStage = { 'auction.currentPrice': 1 };
      if (sortBy === 'price_desc') sortStage = { 'auction.currentPrice': -1 };
      if (sortBy === 'ending_soon') sortStage = { 'auction.endAt': 1 };
      if (sortBy === 'most_bids') sortStage = { 'auction.bidCount': -1 };

      // Aggregate pipeline
      const pipeline = [
        // Stage 1: Match active products
        {
          $match: {
            isActive: true
          }
        },
        // Stage 2: Lookup auction
        {
          $lookup: {
            from: 'auctions',
            localField: '_id',
            foreignField: 'productId',
            as: 'auction'
          }
        },
        // Stage 3: Unwind auction
        {
          $unwind: {
            path: '$auction',
            preserveNullAndEmptyArrays: false
          }
        },
        // Stage 4: Match auction status
        {
          $match: {
            'auction.status': status
          }
        },
        // Stage 5: Lookup seller
        {
          $lookup: {
            from: 'users',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'seller'
          }
        },
        // Stage 6: Unwind seller
        {
          $unwind: {
            path: '$seller',
            preserveNullAndEmptyArrays: true
          }
        },
        // Stage 7: Lookup category
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        // Stage 8: Unwind category
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        // Stage 9: Sort
        {
          $sort: sortStage
        },
        // Stage 10: Skip
        {
          $skip: skip
        },
        // Stage 11: Limit
        {
          $limit: parseInt(limit)
        },
        // Stage 12: Project
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            primaryImageUrl: 1,
            imageUrls: 1,
            createdAt: 1,
            auction: {
              _id: '$auction._id',
              currentPrice: '$auction.currentPrice',
              bidCount: '$auction.bidCount',
              endAt: '$auction.endAt',
              startPrice: '$auction.startPrice',
              status: '$auction.status'
            },
            seller: {
              _id: '$seller._id',
              username: '$seller.username',
              ratingSummary: '$seller.ratingSummary'
            },
            category: {
              _id: '$category._id',
              name: '$category.name'
            }
          }
        }
      ];

      const products = await Product.aggregate(pipeline);

      // Count total
      const totalPipeline = [
        {
          $match: {
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'auctions',
            localField: '_id',
            foreignField: 'productId',
            as: 'auction'
          }
        },
        {
          $unwind: {
            path: '$auction',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'auction.status': status
          }
        },
        {
          $count: 'total'
        }
      ];

      const totalResult = await Product.aggregate(totalPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('[PRODUCT SERVICE] Lỗi getAllProducts:', error);
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
      console.log('[PRODUCT SERVICE] Lấy Top 5 sản phẩm cho Homepage');

      // Top 5 gần kết thúc
      const endingSoon = await Auction.find({ status: 'active' })
        .sort({ endAt: 1 })
        .limit(5)
        .populate({
          path: 'productId',
          select: 'title primaryImageUrl'
        })
        .populate({
          path: 'currentHighestBidderId',
          select: 'username'
        })
        .select('_id currentPrice bidCount endAt')
        .lean();

      // Top 5 nhiều bids nhất
      const mostBids = await Auction.find({ status: 'active' })
        .sort({ bidCount: -1 })
        .limit(5)
        .populate({
          path: 'productId',
          select: 'title primaryImageUrl'
        })
        .populate({
          path: 'currentHighestBidderId',
          select: 'username'
        })
        .select('_id currentPrice bidCount endAt')
        .lean();

      // Top 5 giá cao nhất
      const highestPrice = await Auction.find({ status: 'active' })
        .sort({ currentPrice: -1 })
        .limit(5)
        .populate({
          path: 'productId',
          select: 'title primaryImageUrl'
        })
        .populate({
          path: 'currentHighestBidderId',
          select: 'username'
        })
        .select('_id currentPrice bidCount endAt')
        .lean();

      console.log('[PRODUCT SERVICE] Top products fetched successfully');

      return {
        endingSoon: this._formatTopProducts(endingSoon),
        mostBids: this._formatTopProducts(mostBids),
        highestPrice: this._formatTopProducts(highestPrice)
      };
    } catch (error) {
      console.error('[PRODUCT SERVICE] Lỗi khi lấy top products:', error);
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
  async getProductsByCategory(categoryId, page = 1, limit = 12, sortBy = 'newest') {
    try {

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new AppError('Danh mục không tồn tại', 404, 'CATEGORY_NOT_FOUND');
      }
      console.log('[PRODUCT SERVICE] Category found:', category.name, 'Level:', category.level);

      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
      
      // FIX: If parent category (level 1), get all child categories
      let categoryIds = [categoryObjectId];
      if (category.level === 1) {
        console.log('[PRODUCT SERVICE] Parent category detected, finding child categories...');
        const childCategories = await Category.find({ parentId: categoryObjectId });
        console.log('[PRODUCT SERVICE] Found', childCategories.length, 'child categories');
        categoryIds = childCategories.map(cat => new mongoose.Types.ObjectId(cat._id));
        categoryIds.unshift(categoryObjectId);
      }
      
      const skip = (page - 1) * limit;

      let sortStage = { createdAt: -1 };
      if (sortBy === 'price_asc') sortStage = { 'auction.currentPrice': 1 };
      if (sortBy === 'price_desc') sortStage = { 'auction.currentPrice': -1 };
      if (sortBy === 'ending_soon') sortStage = { 'auction.endAt': 1 };
      if (sortBy === 'most_bids') sortStage = { 'auction.bidCount': -1 };

      const pipeline = [
        // Stage 1: Match products in category (or child categories if parent)
        {
          $match: {
            categoryId: { $in: categoryIds },
            isActive: true
          }
        },
        // Stage 2: Lookup auction
        {
          $lookup: {
            from: 'auctions',
            localField: '_id',
            foreignField: 'productId',
            as: 'auction'
          }
        },
        // Stage 3: Unwind auction (only active auctions)
        {
          $unwind: {
            path: '$auction',
            preserveNullAndEmptyArrays: false
          }
        },
        // Stage 4: Match only active auctions
        {
          $match: {
            'auction.status': 'active'
          }
        },
        // Stage 5: Lookup seller
        {
          $lookup: {
            from: 'users',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'seller'
          }
        },
        // Stage 6: Unwind seller
        {
          $unwind: {
            path: '$seller',
            preserveNullAndEmptyArrays: true
          }
        },
        // Stage 7: Sort
        {
          $sort: sortStage
        },
        // Stage 8: Skip
        {
          $skip: skip
        },
        // Stage 9: Limit
        {
          $limit: parseInt(limit)
        },
        // Stage 10: Project fields
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            primaryImageUrl: 1,
            imageUrls: 1,
            createdAt: 1,
            auction: {
              _id: '$auction._id',
              currentPrice: '$auction.currentPrice',
              bidCount: '$auction.bidCount',
              endAt: '$auction.endAt',
              startPrice: '$auction.startPrice',
              status: '$auction.status'
            },
            seller: {
              _id: '$seller._id',
              username: '$seller.username',
              ratingSummary: '$seller.ratingSummary'
            }
          }
        }
      ];

      // FIX: Execute aggregation
      console.log('[PRODUCT SERVICE] Executing aggregation pipeline...');
      const products = await Product.aggregate(pipeline);
      console.log('[PRODUCT SERVICE] ✅ Aggregation done, found:', products.length);

      // FIX: Get total count - chỉ count products có auction active
      console.log('[PRODUCT SERVICE] Counting total...');
      const totalPipeline = [
        {
          $match: {
            categoryId: { $in: categoryIds },
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'auctions',
            localField: '_id',
            foreignField: 'productId',
            as: 'auction'
          }
        },
        {
          $unwind: {
            path: '$auction',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'auction.status': 'active'
          }
        },
        {
          $count: 'total'
        }
      ];

      const totalResult = await Product.aggregate(totalPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      console.log(`[PRODUCT SERVICE] ✅ API 1.3 complete - Found ${products.length} products, total: ${total}`);

      return {
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[PRODUCT SERVICE] Lỗi khi lấy sản phẩm theo danh mục:', error);
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
      if (filters.sortBy === 'price_asc') sortQuery = { 'auction.currentPrice': 1 };
      if (filters.sortBy === 'price_desc') sortQuery = { 'auction.currentPrice': -1 };
      if (filters.sortBy === 'ending_soon') sortQuery = { 'auction.endAt': 1 };
      if (filters.sortBy === 'most_bids') sortQuery = { 'auction.bidCount': -1 };

      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'auctions',
            localField: '_id',
            foreignField: 'productId',
            as: 'auction'
          }
        },
        { $unwind: '$auction' },
        { $match: { 'auction.status': 'active' } },
        
        // Lọc theo khoảng giá (nếu có)
        ...(filters.minPrice || filters.maxPrice
          ? [
              {
                $match: {
                  ...(filters.minPrice && { 'auction.currentPrice': { $gte: filters.minPrice } }),
                  ...(filters.maxPrice && { 'auction.currentPrice': { $lte: filters.maxPrice } })
                }
              }
            ]
          : []),

        { $sort: sortQuery },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            title: 1,
            primaryImageUrl: 1,
            auction: {
              _id: '$auction._id',
              currentPrice: '$auction.currentPrice',
              bidCount: '$auction.bidCount',
              endAt: '$auction.endAt',
              startPrice: '$auction.startPrice',
              status: '$auction.status'
            },
            ...(searchQuery && { score: { $meta: 'textScore' } })
          }
        }
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
            from: 'auctions',
            localField: '_id',
            foreignField: 'productId',
            as: 'auction'
          }
        },
        { $unwind: '$auction' },
        { $match: { 'auction.status': 'active' } },
        
        // Lọc theo khoảng giá (phải khớp với pipeline lấy dữ liệu)
        ...(filters.minPrice || filters.maxPrice
          ? [
              {
                $match: {
                  ...(filters.minPrice && { 'auction.currentPrice': { $gte: filters.minPrice } }),
                  ...(filters.maxPrice && { 'auction.currentPrice': { $lte: filters.maxPrice } })
                }
              }
            ]
          : []),
        
        { $count: 'total' }
      ];

      const products = await Product.aggregate(pipeline);
      const totalResult = await Product.aggregate(countPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      console.log(`[PRODUCT SERVICE] Tìm kiếm hoàn tất, tìm được ${products.length}/${total} kết quả`);

      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        query: searchQuery
      };
    } catch (error) {
      console.error('[PRODUCT SERVICE] Lỗi khi tìm kiếm sản phẩm:', error);
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
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'username email profileImageUrl ratingSummary');

      if (!product) {
        throw new AppError('Sản phẩm không tồn tại', 404, 'PRODUCT_NOT_FOUND');
      }

      // Chuyển sang plain object
      const productObj = product.toObject ? product.toObject() : product;

      // Lấy thông tin phiên đấu giá hiện tại
      const auction = await Auction.findOne({ productId: productId })
        .select('_id currentPrice bidCount endAt startPrice priceStep buyNowPrice autoExtendEnabled currentHighestBidderId status')
        .lean();

      if (!auction) {
        throw new AppError('Phiên đấu giá không tồn tại', 404, 'AUCTION_NOT_FOUND');
      }

      // Tính thời gian còn lại (ms)
      const timeRemaining = new Date(auction.endAt) - new Date();
      const isAuctionActive = timeRemaining > 0 && auction.status === 'active';

      // Lấy top 5 bidders gần đây (masked information)
      const topBidders = await Bid.find({ auctionId: auction._id })
        .sort({ amount: -1, createdAt: -1 })
        .limit(5)
        .populate('bidderId', 'username ratingSummary')
        .select('amount createdAt bidderId')
        .lean();

      const formattedBidders = topBidders.map(bid => ({
        amount: bid.amount,
        bidderUsername: bid.bidderId?.username || 'Unknown', // Hiển thị username
        bidderRating: bid.bidderId?.ratingSummary?.score || 0,
        createdAt: bid.createdAt
      }));

      const categoryIdRef = productObj.categoryId?._id || productObj.categoryId;
      
      const relatedProducts = await Product.aggregate([
        {
          $match: {
            categoryId: categoryIdRef,
            _id: { $ne: product._id },
            isActive: true
          }
        },
        { $limit: 5 },
        {
          $lookup: {
            from: 'auctions',
            localField: '_id',
            foreignField: 'productId',
            as: 'auction'
          }
        },
        { $unwind: { path: '$auction', preserveNullAndEmptyArrays: true } },
        { $match: { 'auction.status': 'active' } },
        {
          $project: {
            _id: 1,
            title: 1,
            primaryImageUrl: 1,
            'auction._id': 1,
            'auction.currentPrice': 1,
            'auction.bidCount': 1,
            'auction.endAt': 1
          }
        }
      ]);

      console.log(`[PRODUCT SERVICE] Chi tiết sản phẩm lấy thành công`);

      return {
        product: {
          ...productObj,
          auction: {
            ...auction,
            timeRemaining: Math.max(0, timeRemaining),
            isActive: isAuctionActive,
            topBidders: formattedBidders
          }
        },
        relatedProducts: relatedProducts.map(p => ({
          _id: p._id,
          title: p.title,
          primaryImageUrl: p.primaryImageUrl,
          auction: {
            _id: p.auction?._id,
            currentPrice: p.auction?.currentPrice,
            bidCount: p.auction?.bidCount,
            endAt: p.auction?.endAt,
            timeRemaining: p.auction ? new Date(p.auction.endAt) - new Date() : 0
          }
        }))
      };
    } catch (error) {
      console.error('[PRODUCT SERVICE] Lỗi khi lấy chi tiết sản phẩm:', error);
      throw error;
    }
  }

  /**
   * Helper: Format danh sách top products để hiển thị
   */
  _formatTopProducts(auctions) {
    return auctions.map(auction => ({
      auctionId: auction._id,
      product: {
        productId: auction.productId?._id,
        title: auction.productId?.title,
        image: auction.productId?.primaryImageUrl
      },
      currentPrice: auction.currentPrice,
      bidCount: auction.bidCount,
      endAt: auction.endAt,
      timeRemaining: new Date(auction.endAt) - new Date(),
      currentHighestBidder: auction.currentHighestBidderId?.username || 'Chưa có bidder'
    }));
  }
}

export const productService = new ProductService();
