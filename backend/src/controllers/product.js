/**
 * ============================================
 * PRODUCT CONTROLLER - Xử lý HTTP requests
 * API 1.1, 1.2, 1.3, 1.4, 1.5
 * ============================================
 */

import { productService } from '../services/ProductService.js';
import { AppError } from '../utils/errors.js';
import { isValidObjectId } from '../utils/validators.js';
import Product from '../models/Product.js';


/**
 * API 1.1: Lấy tất cả sản phẩm (phân trang, không lọc)
 * Hiển thị danh sách sản phẩm đang hoạt động với các tùy chọn sắp xếp:
 * - newest (mới nhất)
 * - price_asc (giá thấp đến cao)
 * - price_desc (giá cao đến thấp)
 * - ending_soon (gần kết thúc)
 *
 * Query params:
 * - page: số trang (mặc định 1)
 * - limit: số sản phẩm trên trang (mặc định 12)
 * - sortBy: cách sắp xếp (mặc định 'newest')
 *
 * GET /api/products?page=1&limit=12&sortBy=newest
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, sortBy = 'newest' } = req.query;
    const skip = (page - 1) * limit;

    let sortOption = {};
    switch (sortBy) {
      case 'price_asc':
        sortOption = { startPrice: 1 };
        break;
      case 'price_desc':
        sortOption = { startPrice: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'ending_soon':
        sortOption = { endDate: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const total = await Product.countDocuments({ status: 'active' });
    const products = await Product.find({ status: 'active' })
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryId', 'name');

    res.status(200).json({
      status: 'success',
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};



/**
 * API 1.2: Lấy Top 5 sản phẩm cho Trang Chủ
 * Trả về 3 nhóm top products:
 * - Gần kết thúc (endingSoon)
 * - Nhiều lượt ra giá nhất (mostBids)
 * - Giá cao nhất (highestPrice)
 *
 * GET /api/products/home/top
 */
export const getTopProducts = async (req, res, next) => {
  try {
    console.log('[PRODUCT CONTROLLER] GET /api/products/home/top - Lấy top products');

    const topProducts = await productService.getTopProducts();

    res.status(200).json({
      status: 'success',
      message: 'Lấy top products thành công',
      data: topProducts,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Lỗi trong getTopProducts:', error);
    next(error);
  }
};

/**
 * API 1.3: Lấy danh sách sản phẩm theo danh mục (phân trang)
 * Hỗ trợ sắp xếp theo:
 * - newest (mới nhất)
 * - price_asc (giá thấp đến cao)
 * - price_desc (giá cao đến thấp)
 * - ending_soon (gần kết thúc)
 * - most_bids (nhiều bids nhất)
 *
 * GET /api/products/category/:categoryId?page=1&limit=12&sortBy=newest
 */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12, sortBy = 'newest' } = req.query;

    console.log(`[PRODUCT CONTROLLER] GET /api/products/category/${categoryId}`);
    console.log(`[PRODUCT CONTROLLER] Tham số: page=${page}, limit=${limit}, sortBy=${sortBy}`);

    // Validate categoryId
    if (!isValidObjectId(categoryId)) {
      throw new AppError('ID danh mục không hợp lệ', 400, 'INVALID_CATEGORY_ID');
    }

    // Validate sort options
    const validSortOptions = ['newest', 'price_asc', 'price_desc', 'ending_soon', 'most_bids'];
    if (!validSortOptions.includes(sortBy)) {
      throw new AppError(`Tùy chọn sắp xếp không hợp lệ. Chọn: ${validSortOptions.join(', ')}`, 400, 'INVALID_SORT_OPTION');
    }

    const result = await productService.getProductsByCategory(
      categoryId,
      parseInt(page),
      parseInt(limit),
      sortBy
    );

    res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách sản phẩm thành công',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Lỗi trong getProductsByCategory:', error);
    next(error);
  }
};

/**
 * API 1.4: Tìm kiếm sản phẩm (Full-text search) - API NẶNG
 * Hỗ trợ:
 * - Tìm kiếm theo tên sản phẩm (full-text search)
 * - Lọc theo danh mục
 * - Lọc theo khoảng giá (minPrice, maxPrice)
 * - Sắp xếp theo: giá tăng/giảm, thời gian kết thúc, số bids
 *
 * Query params:
 * - q: từ khóa tìm kiếm (yêu cầu, ít nhất 2 ký tự)
 * - categoryId: ID danh mục (tùy chọn)
 * - minPrice: giá tối thiểu (tùy chọn)
 * - maxPrice: giá tối đa (tùy chọn)
 * - sortBy: cách sắp xếp (relevance, price_asc, price_desc, ending_soon, most_bids)
 * - page: số trang (mặc định 1)
 * - limit: số sản phẩm trên trang (mặc định 12)
 *
 * GET /api/products/search?q=iPhone&categoryId=xxx&minPrice=1000000&maxPrice=5000000&sortBy=price_desc&page=1&limit=12
 */
export const searchProducts = async (req, res, next) => {
  try {
    const { q = '', categoryId, minPrice, maxPrice, sortBy = 'relevance', page = 1, limit = 12 } = req.query;

    console.log(`[PRODUCT CONTROLLER] GET /api/products/search?q="${q}"`);
    console.log(`[PRODUCT CONTROLLER] Tham số lọc: categoryId=${categoryId}, minPrice=${minPrice}, maxPrice=${maxPrice}, sortBy=${sortBy}`);

    // Validate search query
    if (!q || q.trim().length < 2) {
      throw new AppError('Vui lòng nhập từ khóa tìm kiếm (ít nhất 2 ký tự)', 400, 'INVALID_SEARCH_QUERY');
    }

    // Validate sort options
    const validSortOptions = ['relevance', 'price_asc', 'price_desc', 'ending_soon', 'most_bids'];
    if (!validSortOptions.includes(sortBy)) {
      throw new AppError(`Tùy chọn sắp xếp không hợp lệ. Chọn: ${validSortOptions.join(', ')}`, 400, 'INVALID_SORT_OPTION');
    }

    // Prepare filters
    const filters = {
      categoryId: categoryId || null,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      sortBy
    };

    const result = await productService.searchProducts(
      q,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      status: 'success',
      message: 'Tìm kiếm sản phẩm thành công',
      data: result.data,
      pagination: result.pagination,
      query: result.query,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Lỗi trong searchProducts:', error);
    next(error);
  }
};

/**
 * API 1.5: Lấy chi tiết sản phẩm (đầy đủ)
 * Hiển thị:
 * - Tất cả thông tin sản phẩm (tiêu đề, ảnh, mô tả, metadata)
 * - Thông tin người bán (username, email, rating)
 * - Thông tin phiên đấu giá (giá hiện tại, số bids, thời gian kết thúc)
 * - Top 5 bidders gần đây (masked info)
 * - 5 sản phẩm cùng danh mục (related products)
 *
 * GET /api/products/:productId
 */
export const getProductDetail = async (req, res, next) => {
  try {
    const { productId } = req.params;

    console.log(`[PRODUCT CONTROLLER] GET /api/products/${productId}`);

    // Validate productId
    if (!isValidObjectId(productId)) {
      throw new AppError('ID sản phẩm không hợp lệ', 400, 'INVALID_PRODUCT_ID');
    }

    const result = await productService.getProductDetail(productId);

    res.status(200).json({
      status: 'success',
      message: 'Lấy chi tiết sản phẩm thành công',
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Lỗi trong getProductDetail:', error);
    next(error);
  }
};


