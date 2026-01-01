/**
 * ============================================
 * CATEGORY ROUTES
 * API 1.1: Menu hệ thống danh mục 2 cấp
 * ============================================
 */

import express from 'express';
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * API 1.1: Lấy tất cả danh mục (Menu 2 cấp)
 * GET /api/categories
 * Response: [ { _id, name, slug, level, children: [...] } ]
 */
router.get('/', getAllCategories);

/**
 * Lấy danh mục cụ thể theo slug
 * GET /api/categories/:slug
 */
router.get('/:slug', getCategoryBySlug);

/**
 * API: Tạo danh mục mới (Admin only)
 * POST /api/categories
 * Body: { name, slug, parentId (optional) }
 */
router.post('/',
  authenticate,
  createCategory
);

/**
 * API: Cập nhật danh mục (Admin only)
 * PUT /api/categories/:categoryId
 * Body: { name, slug, isActive }
 */
router.put('/:categoryId',
  authenticate,
  updateCategory
);

/**
 * API: Xóa danh mục (Admin only)
 * DELETE /api/categories/:categoryId
 * Xóa category và tất cả products liên quan
 * Không xóa nếu có auction đang active với bids
 */
router.delete('/:categoryId',
  authenticate,
  deleteCategory
);

export default router;
