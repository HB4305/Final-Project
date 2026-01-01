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
import Category from '../models/Category.js';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import AutoBid from '../models/AutoBid.js';
import Watchlist from '../models/Watchlist.js';
import Question from '../models/Question.js';
import {
  PRODUCT_VALIDATION,
  AUCTION_VALIDATION,
  SORT_OPTIONS,
  PAGINATION,
  PLACEHOLDER_IMAGES,
  AUCTION_STATUS
} from '../lib/constants.js';


/**
 * API 1.1: Lấy tất cả sản phẩm (phân trang, không lọc)
 * Hiển thị danh sách sản phẩm đang hoạt động với các tùy chọn sắp xếp:
 * - newest (mới nhất)
 * - price_asc (giá thấp đến cao)
 * - price_desc (giá cao đến thấp)
 * - ending_soon (gần kết thúc)
 * - most_bids (nhiều bids nhất)
 *
 * Query params:
 * - page: số trang (mặc định 1)
 * - limit: số sản phẩm trên trang (mặc định 12)
 * - sortBy: cách sắp xếp (mặc định 'newest')
 * - status: trạng thái auction (mặc định 'active')
 *
 * GET /api/products?page=1&limit=12&sortBy=newest&status=active
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { 
      page = PAGINATION.DEFAULT_PAGE, 
      limit = PAGINATION.DEFAULT_LIMIT, 
      sortBy = 'newest', 
      status = AUCTION_STATUS.ACTIVE 
    } = req.query;

    // Validate sort options
    if (!SORT_OPTIONS.PRODUCTS.includes(sortBy)) {
      throw new AppError(`Tùy chọn sắp xếp không hợp lệ. Chọn: ${SORT_OPTIONS.PRODUCTS.join(', ')}`, 400, 'INVALID_SORT_OPTION');
    }

    // Validate status options
    const validStatusOptions = Object.values(AUCTION_STATUS);
    if (!validStatusOptions.includes(status)) {
      throw new AppError(`Trạng thái không hợp lệ. Chọn: ${validStatusOptions.join(', ')}`, 400, 'INVALID_STATUS');
    }

    console.log(`[PRODUCT CONTROLLER] Tham số: page=${page}, limit=${limit}, sortBy=${sortBy}, status=${status}`);

    const result = await productService.getAllProducts(
      parseInt(page), 
      parseInt(limit), 
      sortBy, 
      status
    );

    res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách sản phẩm thành công',
      data: result.products,
      pagination: result.pagination,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Lỗi trong getAllProducts:', error);
    next(error);
  }
};


/**
 * API: Xóa sản phẩm (Admin only)
 * DELETE /api/products/:productId
 * Xóa sản phẩm và tất cả dữ liệu liên quan:
 * - Auction
 * - Bids
 * - AutoBids
 * - Watchlist entries
 * - Questions
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Validate productId
    if (!isValidObjectId(productId)) {
      throw new AppError('ID sản phẩm không hợp lệ', 400, 'INVALID_PRODUCT_ID');
    }

    console.log(`[PRODUCT CONTROLLER] DELETE /api/products/${productId} - Admin: ${userId}`);

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm', 404, 'PRODUCT_NOT_FOUND');
    }

    // Only admin or superadmin can delete products
    if (!['admin', 'superadmin'].some(role => req.user.roles.includes(role))) {
      throw new AppError('Bạn không có quyền xóa sản phẩm', 403, 'FORBIDDEN');
    }

    // Find associated auction
    const auction = await Auction.findOne({ productId: productId });
    
    // Check if auction exists and has active bids
    if (auction) {
      // Cannot delete if auction is active
      if (auction.status === 'active') {
        throw new AppError(
          'Không thể xóa sản phẩm có phiên đấu giá đang hoạt động. Vui lòng chờ đấu giá kết thúc.',
          400,
          'AUCTION_ACTIVE'
        );
      }

      // Cannot delete if auction has bids
      if (auction.bidCount > 0) {
        throw new AppError(
          `Không thể xóa sản phẩm có ${auction.bidCount} lượt đặt cược. Vui lòng chờ đấu giá kết thúc.`,
          400,
          'AUCTION_HAS_BIDS'
        );
      }
    }
    
    // Delete all related data
    const deletePromises = [];

    // Delete auction if exists
    if (auction) {
      deletePromises.push(Auction.findByIdAndDelete(auction._id));
      // Delete all auto bids for this auction
      deletePromises.push(AutoBid.deleteMany({ auctionId: auction._id }));
      console.log(`[PRODUCT CONTROLLER] Xóa auction và auto bids: ${auction._id}`);
    }

    // Delete all bids for this product
    deletePromises.push(Bid.deleteMany({ productId: productId }));
    
    // Delete all watchlist entries for this product
    deletePromises.push(Watchlist.deleteMany({ productId: productId }));
    
    // Delete all questions for this product
    deletePromises.push(Question.deleteMany({ productId: productId }));
    
    // Delete the product itself
    deletePromises.push(Product.findByIdAndDelete(productId));

    // Execute all deletions
    await Promise.all(deletePromises);
    
    console.log(`[PRODUCT CONTROLLER] Đã xóa sản phẩm và tất cả dữ liệu liên quan: ${productId}`);

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công',
      data: {
        productId: product._id,
        title: product.title
      }
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Error in deleteProduct:', error);
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
    const { 
      page = PAGINATION.DEFAULT_PAGE, 
      limit = PAGINATION.DEFAULT_LIMIT, 
      sortBy = 'newest' 
    } = req.query;

    console.log(`[PRODUCT CONTROLLER] GET /api/products/category/${categoryId}`);
    console.log(`[PRODUCT CONTROLLER] Tham số: page=${page}, limit=${limit}, sortBy=${sortBy}`);

    // Validate categoryId
    if (!isValidObjectId(categoryId)) {
      throw new AppError('ID danh mục không hợp lệ', 400, 'INVALID_CATEGORY_ID');
    }

    // Validate sort options
    if (!SORT_OPTIONS.PRODUCTS.includes(sortBy)) {
      throw new AppError(`Tùy chọn sắp xếp không hợp lệ. Chọn: ${SORT_OPTIONS.PRODUCTS.join(', ')}`, 400, 'INVALID_SORT_OPTION');
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
    const { 
      q = '', 
      categoryId, 
      minPrice, 
      maxPrice, 
      sortBy = 'relevance', 
      page = PAGINATION.DEFAULT_PAGE, 
      limit = PAGINATION.DEFAULT_LIMIT 
    } = req.query;

    console.log(`[PRODUCT CONTROLLER] GET /api/products/search?q="${q}"`);
    console.log(`[PRODUCT CONTROLLER] Tham số lọc: categoryId=${categoryId}, minPrice=${minPrice}, maxPrice=${maxPrice}, sortBy=${sortBy}`);

    // Validate search query
    if (!q || q.trim().length < 2) {
      throw new AppError('Vui lòng nhập từ khóa tìm kiếm (ít nhất 2 ký tự)', 400, 'INVALID_SEARCH_QUERY');
    }

    // Validate sort options
    if (!SORT_OPTIONS.SEARCH.includes(sortBy)) {
      throw new AppError(`Tùy chọn sắp xếp không hợp lệ. Chọn: ${SORT_OPTIONS.SEARCH.join(', ')}`, 400, 'INVALID_SORT_OPTION');
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

/**
 * ============================================
 * API 3.1: Đăng sản phẩm đấu giá
 * ============================================
 */
export const postProduct = async (req, res) => {
  try {
    console.log('[PRODUCT CONTROLLER] POST /api/products - Đăng sản phẩm mới');

    // 1. Lấy dữ liệu từ request
    const {
      title,
      description,
      categoryId,
      startPrice,
      priceStep,
      startTime,
      endTime,
      metadata
    } = req.body;

    // 2. Lấy files đã upload (từ multer middleware)
    const uploadedFiles = req.files;

    console.log(`[PRODUCT CONTROLLER] Số ảnh đã upload: ${uploadedFiles?.length || 0}`);

    // ========================================
    // 3. VALIDATE CÁC TRƯỜNG TEXT
    // ========================================

    // Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm không được để trống'
      });
    }

    if (title.length > PRODUCT_VALIDATION.TITLE_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Tên sản phẩm không được vượt quá ${PRODUCT_VALIDATION.TITLE_MAX_LENGTH} ký tự`
      });
    }

    // Validate description
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả sản phẩm không được để trống'
      });
    }

    if (description.length < PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Mô tả sản phẩm phải có ít nhất ${PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH} ký tự`
      });
    }

    // Validate categoryId
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục sản phẩm là bắt buộc'
      });
    }

    // Kiểm tra category tồn tại
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }

    // ========================================
    // 4. VALIDATE GIÁ (startPrice & priceStep)
    // ========================================

    // Validate startPrice
    if (!startPrice) {
      return res.status(400).json({
        success: false,
        message: 'Giá khởi điểm là bắt buộc'
      });
    }

    const numStartPrice = Number(startPrice);

    if (isNaN(numStartPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Giá khởi điểm phải là số hợp lệ'
      });
    }

    if (!Number.isInteger(numStartPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Giá khởi điểm phải là số nguyên'
      });
    }

    if (numStartPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá khởi điểm phải lớn hơn 0'
      });
    }

    if (numStartPrice < AUCTION_VALIDATION.MIN_START_PRICE) {
      return res.status(400).json({
        success: false,
        message: `Giá khởi điểm tối thiểu là ${AUCTION_VALIDATION.MIN_START_PRICE.toLocaleString()} VND`
      });
    }

    // Validate priceStep
    if (!priceStep) {
      return res.status(400).json({
        success: false,
        message: 'Bước giá là bắt buộc'
      });
    }

    const numPriceStep = Number(priceStep);

    if (isNaN(numPriceStep)) {
      return res.status(400).json({
        success: false,
        message: 'Bước giá phải là số hợp lệ'
      });
    }

    if (!Number.isInteger(numPriceStep)) {
      return res.status(400).json({
        success: false,
        message: 'Bước giá phải là số nguyên'
      });
    }

    if (numPriceStep <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bước giá phải lớn hơn 0'
      });
    }

    if (numPriceStep < AUCTION_VALIDATION.MIN_PRICE_STEP) {
      return res.status(400).json({
        success: false,
        message: `Bước giá tối thiểu là ${AUCTION_VALIDATION.MIN_PRICE_STEP.toLocaleString()} VND`
      });
    }

    // ⭐ Validate priceStep < startPrice
    if (numPriceStep >= numStartPrice) {
      return res.status(400).json({
        success: false,
        message: `Bước giá (${numPriceStep.toLocaleString()} VND) phải nhỏ hơn giá khởi điểm (${numStartPrice.toLocaleString()} VND)`
      });
    }

    // ========================================
    // 5. VALIDATE THỜI GIAN
    // ========================================
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian bắt đầu và kết thúc là bắt buộc'
      });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian bắt đầu không hợp lệ'
      });
    }

    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc không hợp lệ'
      });
    }

    if (startDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian bắt đầu phải sau thời điểm hiện tại'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
      });
    }

    const minDuration = AUCTION_VALIDATION.MIN_DURATION_MS;
    if (endDate - startDate < minDuration) {
      return res.status(400).json({
        success: false,
        message: `Thời gian đấu giá phải ít nhất ${AUCTION_VALIDATION.MIN_DURATION_HOURS} giờ`
      });
    }

    // ========================================
    // 6. XỬ LÝ ẢNH
    // ⚠️ KHÔNG VALIDATE Ở ĐÂY - ĐÃ VALIDATE Ở MIDDLEWARE
    // ========================================

    let imageUrls;
    let primaryImageUrl;

    // Nếu có middleware upload (production)
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log(`[PRODUCT CONTROLLER] Upload ${uploadedFiles.length} ảnh lên cloud storage...`);

      // Production: Upload thực tế lên Cloudinary/S3
      // const uploadPromises = uploadedFiles.map(file => uploadToCloudinary(file.buffer));
      // imageUrls = await Promise.all(uploadPromises);

      // Development: Tạm thời dùng fake URLs với timestamp unique
      imageUrls = uploadedFiles.map((file, index) => {
        return `https://cloudinary.com/uploads/${Date.now()}-${index}-${file.originalname || 'image.jpg'}`;
      });

      primaryImageUrl = imageUrls[0];

      console.log(`[PRODUCT CONTROLLER] ✓ Uploaded ${imageUrls.length} ảnh`);
    }
    // Nếu không có middleware (test mode)
    else {
      console.log('[PRODUCT CONTROLLER] ⚠️ TEST MODE: Sử dụng placeholder image URLs');

      imageUrls = PLACEHOLDER_IMAGES.PRODUCT;
      primaryImageUrl = imageUrls[0];
    }

    // ========================================
    // 7. TẠO SLUG
    // ========================================
    const slug = title
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');

    // ========================================
    // 8. TẠO PRODUCT
    // ========================================
    
    // Lấy sellerId từ authenticated user
    const sellerId = req.user?._id || req.user?.id;
    
    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để đăng sản phẩm'
      });
    }

    const newProduct = new Product({
      sellerId,
      categoryId,
      title: title.trim(),
      slug,
      descriptionHistory: [
        {
          text: description.trim(),
          createdAt: new Date(),
          authorId: sellerId
        }
      ],
      primaryImageUrl,
      imageUrls,
      // Nếu gửi JSON: metadata đã là object
      // Nếu gửi form-data: metadata là string, cần parse
      metadata: typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {}),
      baseCurrency: 'VND',
      isActive: true,
      flags: {
        featured: false,
        highlightedUntil: null,
        isNewUntil: new Date(Date.now() + AUCTION_VALIDATION.NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000)
      }
    });

    const savedProduct = await newProduct.save();
    console.log(`[PRODUCT CONTROLLER] Product created: ${savedProduct._id}`);

    // ========================================
    // 9. TẠO AUCTION SESSION
    // ========================================
    const newAuction = new Auction({
      productId: savedProduct._id,
      sellerId,
      startPrice: numStartPrice,
      priceStep: numPriceStep,
      currentPrice: numStartPrice,
      startAt: startDate,
      endAt: endDate,
      status: startDate > now ? AUCTION_STATUS.SCHEDULED : AUCTION_STATUS.ACTIVE,
      bidCount: 0,
      autoExtendEnabled: true
    });

    const savedAuction = await newAuction.save();
    console.log(`[PRODUCT CONTROLLER] Auction created: ${savedAuction._id}`);

    // ========================================
    // 10. TRẢ VỀ RESPONSE
    // ========================================
    await savedProduct.populate('categoryId', 'name slug');

    const isTestMode = !uploadedFiles || uploadedFiles.length === 0;

    return res.status(201).json({
      success: true,
      message: isTestMode
        ? '✅ TEST MODE: Đăng sản phẩm thành công (fake images)'
        : 'Đăng sản phẩm đấu giá thành công',
      data: {
        product: {
          _id: savedProduct._id,
          title: savedProduct.title,
          slug: savedProduct.slug,
          category: savedProduct.categoryId,
          primaryImageUrl: savedProduct.primaryImageUrl,
          imageUrls: savedProduct.imageUrls,
          description: savedProduct.descriptionHistory[0].text,
          metadata: savedProduct.metadata,
          createdAt: savedProduct.createdAt
        },
        auction: {
          _id: savedAuction._id,
          startPrice: savedAuction.startPrice,
          priceStep: savedAuction.priceStep,
          currentPrice: savedAuction.currentPrice,
          startTime: savedAuction.startAt,  // ← Map từ startAt
          endTime: savedAuction.endAt,      // ← Map từ endAt
          status: savedAuction.status,
          bidCount: savedAuction.bidCount
        }
      }
    });

  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Error in postProduct:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng sản phẩm',
      error: error.message
    });
  }
};

/**
 * Toggle auto-extend for seller's auction
 * PUT /api/products/:productId/auto-extend
 */
export const toggleAutoExtend = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { autoExtendEnabled } = req.body;
    const userId = req.user?._id;
    const userRoles = req.user?.roles || [];

    // Validate productId
    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Validate autoExtendEnabled
    if (typeof autoExtendEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'autoExtendEnabled must be a boolean'
      });
    }

    // Find product and check ownership
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership: seller hoặc admin
    const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
    const isSeller = userId && product.seller.toString() === userId.toString();
    
    if (userId && !isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this product'
      });
    }

    // Find auction
    const auction = await Auction.findOne({ product: productId });
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found for this product'
      });
    }

    // Check if auction is still active
    if (auction.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only modify auto-extend for active auctions'
      });
    }

    // Update auction
    auction.autoExtendEnabled = autoExtendEnabled;
    await auction.save();

    res.json({
      success: true,
      message: `Auto-extend ${autoExtendEnabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        productId,
        auctionId: auction._id,
        autoExtendEnabled: auction.autoExtendEnabled,
        autoExtendCount: auction.autoExtendCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * API 3.2: Bổ sung thông tin mô tả sản phẩm
 * PUT /api/products/:productId/description
 * ============================================
 * Cho phép seller cập nhật mô tả, metadata của sản phẩm
 * Không cho phép thay đổi giá, thời gian nếu đã có bid
 */
export const updateProductDescription = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { description, metadata } = req.body;
    const userId = req.user?._id;
    const userRoles = req.user?.roles || [];

    console.log(`[PRODUCT CONTROLLER] PUT /api/products/${productId}/description`);

    // Validate productId
    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Check ownership: seller hoặc admin
    const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
    const isSeller = userId && product.sellerId.toString() === userId.toString();
    
    if (!isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa sản phẩm này'
      });
    }

    // Find auction
    const auction = await Auction.findOne({ productId });
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Phiên đấu giá không tồn tại'
      });
    }

    // Check auction status - không cho phép edit khi ended/cancelled
    if (['ended', 'cancelled'].includes(auction.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật mô tả cho phiên đấu giá đã kết thúc hoặc bị hủy'
      });
    }

    // Validate description nếu có
    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Mô tả sản phẩm không được để trống'
        });
      }

      if (description.length < PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Mô tả sản phẩm phải có ít nhất ${PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH} ký tự`
        });
      }

      // Add new description to history
      product.descriptionHistory.push({
        text: description.trim(),
        createdAt: new Date(),
        authorId: userId
      });

      console.log('[PRODUCT CONTROLLER] Added new description to history');
    }
    
    // Update metadata nếu có
    if (metadata !== undefined) {
      product.metadata = { ...product.metadata, ...metadata };
      console.log('[PRODUCT CONTROLLER] Updated metadata');
    }
    
    product.updatedAt = new Date();
    await product.save();

    // Populate để trả về đầy đủ
    await product.populate('categoryId', 'name slug');

    // Get latest description
    const latestDescription = product.descriptionHistory.length > 0 
      ? product.descriptionHistory[product.descriptionHistory.length - 1].text 
      : '';

    res.json({
      success: true,
      message: 'Cập nhật mô tả sản phẩm thành công',
      data: {
        product: {
          _id: product._id,
          title: product.title,
          description: latestDescription,
          descriptionHistory: product.descriptionHistory,
          metadata: product.metadata,
          primaryImageUrl: product.primaryImageUrl,
          category: product.categoryId,
          updatedAt: product.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Error in updateProductDescription:', error);
    next(error);
  }
};

/**
 * ============================================
 * API 3.3: Từ chối lượt ra giá của bidder
 * POST /api/products/:productId/reject-bidder
 * ============================================
 * Seller từ chối một bidder, nếu bidder đang thắng
 * thì chuyển người thắng sang bidder thứ 2
 */
export const rejectBidder = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { bidderId, reason } = req.body;
    const userId = req.user?._id;
    const userRoles = req.user?.roles || [];

    console.log(`[PRODUCT CONTROLLER] POST /api/products/${productId}/reject-bidder`);
    console.log(`[PRODUCT CONTROLLER] Rejecting bidder: ${bidderId}`);

    // Validate input
    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    if (!isValidObjectId(bidderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bidder không hợp lệ'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lý do từ chối là bắt buộc'
      });
    }

    // Check user cannot reject themselves
    if (userId && userId.toString() === bidderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể từ chối chính mình'
      });
    }

    // Find product and check ownership
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Check ownership: seller hoặc admin
    const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
    const isSeller = userId && product.sellerId.toString() === userId.toString();
    
    if (!isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền từ chối bidder cho sản phẩm này'
      });
    }

    // Call BidService to handle rejection logic
    const { BidService: BidServiceClass } = await import('../services/BidService.js');
    const bidService = new BidServiceClass();
    
    const result = await bidService.rejectBidder(productId, bidderId, userId, reason);

    res.json({
      success: true,
      message: 'Từ chối bidder thành công',
      data: result
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Error in rejectBidder:', error);
    
    if (error.message === 'Auction not found') {
      return res.status(404).json({
        success: false,
        message: 'Phiên đấu giá không tồn tại'
      });
    }
    
    next(error);
  }
};

/**
 * ============================================
 * API 3.3: Bidder tự rút lại bid
 * POST /api/products/:productId/withdraw-bid
 * ============================================
 * Bidder có thể tự rút lại tất cả bids của mình
 */
export const withdrawBid = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const userId = req.user?._id;

    console.log(`[PRODUCT CONTROLLER] POST /api/products/${productId}/withdraw-bid`);
    console.log(`[PRODUCT CONTROLLER] User ${userId} withdrawing bid`);

    // Validate input
    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    // Call BidService to handle withdrawal logic
    const { BidService: BidServiceClass } = await import('../services/BidService.js');
    const bidService = new BidServiceClass();
    
    const result = await bidService.withdrawBid(
      productId, 
      userId.toString(), 
      reason || 'Bidder tự rút lại giá'
    );

    res.json({
      success: true,
      message: 'Rút giá thành công',
      data: result
    });
  } catch (error) {
    console.error('[PRODUCT CONTROLLER] Error in withdrawBid:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('no active bids') || error.message.includes('only withdraw')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

