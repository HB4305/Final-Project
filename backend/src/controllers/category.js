/**
 * ============================================
 * CATEGORY CONTROLLER - Xử lý HTTP requests danh mục
 * API 1.1: Hệ thống Menu (danh mục 2 cấp)
 * ============================================
 */

import Category from '../models/Category.js';
import { AppError } from '../utils/errors.js';

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

    console.log(`[CATEGORY CONTROLLER] Tìm được ${parentCategories.length} danh mục cha`);

    // Lấy tất cả child categories (level = 2)
    const childCategories = await Category.find({ parentId: { $ne: null } })
      .select('_id name slug parentId level')
      .lean();

    console.log(`[CATEGORY CONTROLLER] Tìm được ${childCategories.length} danh mục con`);

    // Kết hợp: mỗi parent category chứa children array
    const categoriesWithChildren = parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child =>
        child.parentId.toString() === parent._id.toString()
      )
    }));

    console.log('[CATEGORY CONTROLLER] Nesting danh mục thành công');

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

    console.log(`[CATEGORY CONTROLLER] GET /api/categories/${slug}`);

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

    console.log(`[CATEGORY CONTROLLER] Lấy danh mục thành công: ${slug}`);

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
