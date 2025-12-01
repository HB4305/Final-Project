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

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm không được vượt quá 200 ký tự'
      });
    }

    // Validate description
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả sản phẩm không được để trống'
      });
    }

    if (description.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả sản phẩm phải có ít nhất 50 ký tự'
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

    if (numStartPrice < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Giá khởi điểm tối thiểu là 10,000 VND'
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

    if (numPriceStep < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Bước giá tối thiểu là 1,000 VND'
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

    const minDuration = 60 * 60 * 1000; // 1 hour
    if (endDate - startDate < minDuration) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian đấu giá phải ít nhất 1 giờ'
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

      // TODO: Upload thực tế lên Cloudinary/S3
      // const uploadPromises = uploadedFiles.map(file => uploadToCloudinary(file.buffer));
      // imageUrls = await Promise.all(uploadPromises);

      // Tạm thời dùng fake URLs
      imageUrls = uploadedFiles.map((file, index) => {
        return `https://cloudinary.com/fake-url/${Date.now()}-${index}.jpg`;
      });

      primaryImageUrl = imageUrls[0];

      console.log(`[PRODUCT CONTROLLER] ✓ Uploaded ${imageUrls.length} ảnh`);
    }
    // Nếu không có middleware (test mode)
    else {
      console.log('[PRODUCT CONTROLLER] ⚠️ TEST MODE: Sử dụng fake image URLs');

      imageUrls = [
        'https://via.placeholder.com/800x600/FF5733/FFFFFF?text=Product+Image+1',
        'https://via.placeholder.com/800x600/33FF57/FFFFFF?text=Product+Image+2',
        'https://via.placeholder.com/800x600/3357FF/FFFFFF?text=Product+Image+3'
      ];

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
    const newProduct = new Product({
      sellerId: '674b2d5e8f9a1b2c3d4e5f60', // TODO: req.user._id
      categoryId,
      title: title.trim(),
      slug,
      descriptionHistory: [
        {
          text: description.trim(),
          createdAt: new Date(),
          authorId: '674b2d5e8f9a1b2c3d4e5f60' // TODO: req.user._id
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
        isNewUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const savedProduct = await newProduct.save();
    console.log(`[PRODUCT CONTROLLER] Product created: ${savedProduct._id}`);

    // ========================================
    // 9. TẠO AUCTION SESSION
    // ========================================
    const newAuction = new Auction({
      productId: savedProduct._id,
      sellerId: '674b2d5e8f9a1b2c3d4e5f60', // TODO: req.user._id
      startPrice: numStartPrice,
      priceStep: numPriceStep,
      currentPrice: numStartPrice,
      startAt: startDate,  // ← Sửa từ startTime
      endAt: endDate,      // ← Sửa từ endTime
      status: startDate > now ? 'scheduled' : 'active', // ← Sửa 'pending' thành 'scheduled'
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
