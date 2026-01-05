/**
 * ============================================
 * CATEGORY CONTROLLER - Xử lý HTTP requests danh mục
 * API 1.1: Hệ thống Menu (danh mục 2 cấp)
 * ============================================
 */

import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import AutoBid from '../models/AutoBid.js';
import Watchlist from '../models/Watchlist.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { AppError } from '../utils/errors.js';
import { isValidObjectId } from '../utils/validators.js';

/**
 * API 1.1: Lấy danh sách danh mục 2 cấp (Menu)
 * Trả về tất cả parent categories với children nesting bên trong
 * Cấu trúc:
 * [
 *   {
 *     _id: "...",
 *     name: "Điện tử",
 *     slug: "dien-tu",
 *     level: 1,
 *     children: [
 *       { _id: "...", name: "Điện thoại", slug: "dien-thoai", parentId: "...", level: 2 },
 *       { _id: "...", name: "Laptop", slug: "laptop", parentId: "...", level: 2 }
 *     ]
 *   }
 * ]
 *
 * GET /api/categories
 */
export const getAllCategories = async (req, res, next) => {
  try {

    // Lấy tất cả parent categories (level = 1)
    const parentCategories = await Category.find({ parentId: null })
      .select('_id name slug level')
      .lean();

    // Lấy tất cả child categories (level = 2)
    const childCategories = await Category.find({ parentId: { $ne: null } })
      .select('_id name slug parentId level')
      .lean();


    // Aggregation: Đếm số lượng sản phẩm đang có AUCTION ACTIVE cho mỗi danh mục
    // Fix: Chỉ đếm những sản phẩm thực sự đang đấu giá (Auction status='active' & chưa hết hạn)
    const auctionCounts = await Auction.aggregate([
      { 
        $match: { 
          status: 'active',
          endAt: { $gt: new Date() } 
        } 
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.isActive': true } },
      { $group: { _id: '$product.categoryId', count: { $sum: 1 } } }
    ]);

    // Convert to lookup map: { categoryId: count }
    const countMap = {};
    auctionCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    // Kết hợp: mỗi parent category chứa children array và tính toán productCount
    const categoriesWithChildren = parentCategories.map(parent => {
      // Find children for this parent
      const children = childCategories.filter(child =>
        child.parentId.toString() === parent._id.toString()
      ).map(child => ({
        ...child,
        productCount: countMap[child._id.toString()] || 0
      }));

      // Calculate total count for parent (own products + children's products)
      const ownCount = countMap[parent._id.toString()] || 0;
      const childrenCount = children.reduce((sum, child) => sum + child.productCount, 0);

      return {
        ...parent,
        productCount: ownCount + childrenCount,
        children
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Lấy danh mục thành công',
      data: categoriesWithChildren,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[CATEGORY CONTROLLER] Lỗi trong getAllCategories:', error);
    next(error);
  }
};

/**
 * API 1.1 (Chi tiết): Lấy danh mục cụ thể theo slug
 * GET /api/categories/:slug
 */
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;


    const category = await Category.findOne({ slug }).lean();

    if (!category) {
      throw new AppError('Danh mục không tồn tại', 404, 'CATEGORY_NOT_FOUND');
    }

    // Nếu là parent category, lấy child categories
    let children = [];
    if (category.parentId === null) {
      children = await Category.find({ parentId: category._id })
        .select('_id name slug level')
        .lean();
    }

    res.status(200).json({
      status: 'success',
      message: 'Lấy danh mục thành công',
      data: {
        ...category,
        children
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[CATEGORY CONTROLLER] Lỗi trong getCategoryBySlug:', error);
    next(error);
  }
};

/**
 * API: Tạo danh mục mới (Admin only)
 * POST /api/categories
 * Body: { name, slug, parentId (optional), level }
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, parentId, level } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!name) {
      throw new AppError('Tên danh mục là bắt buộc', 400, 'MISSING_FIELDS');
    }

    // Auto-generate slug from name if not provided
    let categorySlug = slug;
    if (!categorySlug) {
      categorySlug = name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Only admin or superadmin can create categories
    if (!['admin', 'superadmin'].some(role => req.user.roles.includes(role))) {
      throw new AppError('Bạn không có quyền tạo danh mục', 403, 'FORBIDDEN');
    }

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: categorySlug });
    if (existingCategory) {
      throw new AppError('Slug danh mục đã tồn tại', 400, 'DUPLICATE_SLUG');
    }

    // Validate parentId if provided
    if (parentId) {
      if (!isValidObjectId(parentId)) {
        throw new AppError('Parent ID không hợp lệ', 400, 'INVALID_PARENT_ID');
      }

      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        throw new AppError('Danh mục cha không tồn tại', 404, 'PARENT_NOT_FOUND');
      }

      // Parent must be level 1
      if (parentCategory.level !== 1) {
        throw new AppError('Danh mục cha phải là level 1', 400, 'INVALID_PARENT_LEVEL');
      }
    }

    // Create category
    const category = new Category({
      name,
      slug: categorySlug,
      parentId: parentId || null,
      level: parentId ? 2 : 1,
      path: parentId ? [parentId] : []
    });

    await category.save();
    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: category
    });
  } catch (error) {
    console.error('[CATEGORY CONTROLLER] Error in createCategory:', error);
    next(error);
  }
};

/**
 * API: Cập nhật danh mục (Admin only)
 * PUT /api/categories/:categoryId
 * Body: { name, slug, isActive }
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, slug, isActive } = req.body;
    const userId = req.user._id;

    // Validate categoryId
    if (!isValidObjectId(categoryId)) {
      throw new AppError('ID danh mục không hợp lệ', 400, 'INVALID_CATEGORY_ID');
    }

    // Only admin or superadmin can update categories
    if (!['admin', 'superadmin'].some(role => req.user.roles.includes(role))) {
      throw new AppError('Bạn không có quyền cập nhật danh mục', 403, 'FORBIDDEN');
    }

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Không tìm thấy danh mục', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check if new slug is duplicated (if changed)
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        throw new AppError('Slug danh mục đã tồn tại', 400, 'DUPLICATE_SLUG');
      }
    }

    // Update fields
    if (name) category.name = name;
    if (slug) category.slug = slug;
    
    // If deactivating category, notify affected users
    if (typeof isActive === 'boolean' && isActive === false && category.isActive === true) {
      // Find all products in this category
      const products = await Product.find({ categoryId: categoryId }).populate('sellerId', 'email fullName');
      
      if (products.length > 0) {
        console.log(`[CATEGORY CONTROLLER] Danh mục bị vô hiệu hóa, thông báo cho ${products.length} sellers`);
        
        // Get unique sellers
        const sellers = [...new Map(products.map(p => [p.sellerId._id.toString(), p.sellerId])).values()];
        
        // Send email to sellers
        for (const seller of sellers) {
          if (seller && seller.email) {
            try {
              await sendEmail({
                to: seller.email,
                subject: `Thông báo: Danh mục "${category.name}" đã bị vô hiệu hóa`,
                html: `
                  <h2>Danh mục bị vô hiệu hóa</h2>
                  <p>Xin chào ${seller.fullName || 'người dùng'},</p>
                  <p>Danh mục <strong>"${category.name}"</strong> mà bạn có sản phẩm đang bán đã bị quản trị viên vô hiệu hóa.</p>
                  <p>Sản phẩm của bạn vẫn tồn tại nhưng sẽ không hiển thị trong danh mục này nữa.</p>
                  <p>Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</p>
                  <p>Trân trọng,<br/>Đội ngũ Auction Platform</p>
                `
              });
            } catch (emailError) {
              console.error(`Failed to send email to ${seller.email}:`, emailError);
            }
          }
        }
        
        // Get all auctions for products in this category
        const productIds = products.map(p => p._id);
        const auctions = await Auction.find({ productId: { $in: productIds } });
        const auctionIds = auctions.map(a => a._id);
        
        // Get all bidders
        const bids = await Bid.find({ auctionId: { $in: auctionIds } }).populate('bidderId', 'email fullName');
        const uniqueBidders = [...new Map(bids.map(b => [b.bidderId._id.toString(), b.bidderId])).values()];
        
        // Send email to bidders
        for (const bidder of uniqueBidders) {
          if (bidder && bidder.email) {
            try {
              await sendEmail({
                to: bidder.email,
                subject: `Thông báo: Danh mục "${category.name}" đã bị vô hiệu hóa`,
                html: `
                  <h2>Danh mục bị vô hiệu hóa</h2>
                  <p>Xin chào ${bidder.fullName || 'người dùng'},</p>
                  <p>Danh mục <strong>"${category.name}"</strong> có chứa sản phẩm mà bạn đang tham gia đấu giá đã bị quản trị viên vô hiệu hóa.</p>
                  <p>Các cuộc đấu giá của bạn vẫn tiếp tục nhưng danh mục sẽ không hiển thị công khai.</p>
                  <p>Trân trọng,<br/>Đội ngũ Auction Platform</p>
                `
              });
            } catch (emailError) {
              console.error(`Failed to send email to ${bidder.email}:`, emailError);
            }
          }
        }
      }
    }
    
    if (typeof isActive === 'boolean') category.isActive = isActive;
    category.updatedAt = Date.now();

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category
    });
  } catch (error) {
    console.error('[CATEGORY CONTROLLER] Error in updateCategory:', error);
    next(error);
  }
};

/**
 * API: Xóa danh mục (Admin only)
 * DELETE /api/categories/:categoryId
 * 
 * Logic:
 * 1. Kiểm tra danh mục có tồn tại không
 * 2. Kiểm tra danh mục có sản phẩm không → nếu có thì throw error
 * 3. Nếu là parent category, kiểm tra child categories có sản phẩm không
 * 4. Xóa danh mục (chỉ nếu không có sản phẩm)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user._id;

    // Validate categoryId
    if (!isValidObjectId(categoryId)) {
      throw new AppError('ID danh mục không hợp lệ', 400, 'INVALID_CATEGORY_ID');
    }


    // Only admin or superadmin can delete categories
    if (!['admin', 'superadmin'].some(role => req.user.roles.includes(role))) {
      throw new AppError('Bạn không có quyền xóa danh mục', 403, 'FORBIDDEN');
    }

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Không tìm thấy danh mục', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ categoryId: categoryId });
    if (productCount > 0) {
      throw new AppError(
        `Không thể xóa danh mục "${category.name}" vì còn ${productCount} sản phẩm đang thuộc danh mục này`,
        400,
        'CATEGORY_HAS_PRODUCTS'
      );
    }

    // If this is a parent category (level 1), check child categories
    if (category.level === 1) {
      const childCategories = await Category.find({ parentId: categoryId });
      if (childCategories.length > 0) {
        // Check if any child category has products
        for (const childCat of childCategories) {
          const childProductCount = await Product.countDocuments({ categoryId: childCat._id });
          if (childProductCount > 0) {
            throw new AppError(
              `Không thể xóa danh mục cha "${category.name}" vì danh mục con "${childCat.name}" còn ${childProductCount} sản phẩm`,
              400,
              'CHILD_CATEGORY_HAS_PRODUCTS'
            );
          }
        }

        // Delete all child categories (they have no products)
        await Category.deleteMany({ parentId: categoryId });
        console.log(`[CATEGORY CONTROLLER] Đã xóa ${childCategories.length} danh mục con`);
      }
    }

    // Delete the category
    await Category.findByIdAndDelete(categoryId);
    

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công',
      data: {
        categoryId: category._id,
        name: category.name
      }
    });
  } catch (error) {
    console.error('[CATEGORY CONTROLLER] Error in deleteCategory:', error);
    next(error);
  }
};
