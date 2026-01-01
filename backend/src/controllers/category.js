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
    console.log('[CATEGORY CONTROLLER] GET /api/categories - Lấy tất cả danh mục');

    // Lấy tất cả parent categories (level = 1)
    const parentCategories = await Category.find({ parentId: null })
      .select('_id name slug level')
      .lean();

    // Lấy tất cả child categories (level = 2)
    const childCategories = await Category.find({ parentId: { $ne: null } })
      .select('_id name slug parentId level')
      .lean();


    // Kết hợp: mỗi parent category chứa children array
    const categoriesWithChildren = parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child =>
        child.parentId.toString() === parent._id.toString()
      )
    }));

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

    console.log(`[CATEGORY CONTROLLER] POST /api/categories - Admin: ${userId}`);

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
      
      console.log(`[CATEGORY CONTROLLER] Auto-generated slug: ${categorySlug}`);
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

    console.log(`[CATEGORY CONTROLLER] Đã tạo danh mục: ${category._id}`);

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

    console.log(`[CATEGORY CONTROLLER] PUT /api/categories/${categoryId} - Admin: ${userId}`);

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
    if (typeof isActive === 'boolean') category.isActive = isActive;
    category.updatedAt = Date.now();

    await category.save();

    console.log(`[CATEGORY CONTROLLER] Đã cập nhật danh mục: ${categoryId}`);

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
 * 2. Tìm tất cả sản phẩm thuộc danh mục này
 * 3. Với mỗi sản phẩm, kiểm tra auction:
 *    - Nếu auction đang active (status = 'active') và có bids: KHÔNG XÓA
 *    - Nếu auction chưa có bids hoặc không active: XÓA
 * 4. Nếu có auction đang active với bids, trả về lỗi
 * 5. Xóa tất cả products và related data (auctions, bids, watchlists, questions)
 * 6. Xóa danh mục
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user._id;

    // Validate categoryId
    if (!isValidObjectId(categoryId)) {
      throw new AppError('ID danh mục không hợp lệ', 400, 'INVALID_CATEGORY_ID');
    }

    console.log(`[CATEGORY CONTROLLER] DELETE /api/categories/${categoryId} - Admin: ${userId}`);

    // Only admin or superadmin can delete categories
    console.log("Role: ", req.user.roles);
    if (!['admin', 'superadmin'].some(role => req.user.roles.includes(role))) {
      throw new AppError('Bạn không có quyền xóa danh mục', 403, 'FORBIDDEN');
    }

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Không tìm thấy danh mục', 404, 'CATEGORY_NOT_FOUND');
    }

    // Find all products in this category
    const products = await Product.find({ categoryId: categoryId });
    
    if (products.length > 0) {
      console.log(`[CATEGORY CONTROLLER] Tìm thấy ${products.length} sản phẩm trong danh mục`);

      // Check each product's auction status
      const productIds = products.map(p => p._id);
      const auctions = await Auction.find({ productId: { $in: productIds } });

      // Check for active auctions with bids
      const activeAuctionsWithBids = [];
      
      for (const auction of auctions) {
        if (auction.status === 'active' && auction.bidCount > 0) {
          const product = products.find(p => p._id.toString() === auction.productId.toString());
          activeAuctionsWithBids.push({
            productId: auction.productId,
            productTitle: product?.title || 'Unknown',
            bidCount: auction.bidCount
          });
        }
      }

      // If there are active auctions with bids, cannot delete
      if (activeAuctionsWithBids.length > 0) {
        throw new AppError(
          `Không thể xóa danh mục vì có ${activeAuctionsWithBids.length} sản phẩm đang được đấu giá với lượt đặt cược. Vui lòng chờ đấu giá kết thúc.`,
          400,
          'CATEGORY_HAS_ACTIVE_AUCTIONS',
          { activeAuctions: activeAuctionsWithBids }
        );
      }

      // Delete all products and their related data
      console.log(`[CATEGORY CONTROLLER] Xóa tất cả sản phẩm và dữ liệu liên quan...`);

      for (const product of products) {
        const auction = auctions.find(a => a.productId.toString() === product._id.toString());
        
        const deletePromises = [];

        // Delete auction and auto bids if exists
        if (auction) {
          deletePromises.push(Auction.findByIdAndDelete(auction._id));
          deletePromises.push(AutoBid.deleteMany({ auctionId: auction._id }));
        }

        // Delete all related data
        deletePromises.push(Bid.deleteMany({ productId: product._id }));
        deletePromises.push(Watchlist.deleteMany({ productId: product._id }));
        deletePromises.push(Question.deleteMany({ productId: product._id }));
        deletePromises.push(Product.findByIdAndDelete(product._id));

        await Promise.all(deletePromises);
      }

      console.log(`[CATEGORY CONTROLLER] Đã xóa ${products.length} sản phẩm và dữ liệu liên quan`);
    }

    // If this is a parent category (level 1), also delete child categories
    if (category.level === 1) {
      const childCategories = await Category.find({ parentId: categoryId });
      if (childCategories.length > 0) {
        // Check if child categories have products with active auctions
        for (const childCat of childCategories) {
          const childProducts = await Product.find({ categoryId: childCat._id });
          if (childProducts.length > 0) {
            const childProductIds = childProducts.map(p => p._id);
            const childAuctions = await Auction.find({ 
              productId: { $in: childProductIds },
              status: 'active',
              bidCount: { $gt: 0 }
            });

            if (childAuctions.length > 0) {
              throw new AppError(
                `Không thể xóa danh mục cha vì danh mục con "${childCat.name}" có sản phẩm đang được đấu giá`,
                400,
                'CHILD_CATEGORY_HAS_ACTIVE_AUCTIONS'
              );
            }
          }
        }

        // Delete all child categories and their products
        for (const childCat of childCategories) {
          // Delete products in child category (same logic as above)
          const childProducts = await Product.find({ categoryId: childCat._id });
          for (const product of childProducts) {
            const auction = await Auction.findOne({ productId: product._id });
            const deletePromises = [];

            if (auction) {
              deletePromises.push(Auction.findByIdAndDelete(auction._id));
              deletePromises.push(AutoBid.deleteMany({ auctionId: auction._id }));
            }

            deletePromises.push(Bid.deleteMany({ productId: product._id }));
            deletePromises.push(Watchlist.deleteMany({ productId: product._id }));
            deletePromises.push(Question.deleteMany({ productId: product._id }));
            deletePromises.push(Product.findByIdAndDelete(product._id));

            await Promise.all(deletePromises);
          }

          // Delete child category
          await Category.findByIdAndDelete(childCat._id);
        }

        console.log(`[CATEGORY CONTROLLER] Đã xóa ${childCategories.length} danh mục con`);
      }
    }

    // Delete the category
    await Category.findByIdAndDelete(categoryId);
    
    console.log(`[CATEGORY CONTROLLER] Đã xóa danh mục: ${categoryId}`);

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công',
      data: {
        categoryId: category._id,
        name: category.name,
        productsDeleted: products.length
      }
    });
  } catch (error) {
    console.error('[CATEGORY CONTROLLER] Error in deleteCategory:', error);
    next(error);
  }
};
