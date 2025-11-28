/**
 * ============================================
 * CATEGORY ROUTES
 * API 1.1: Menu hệ thống danh mục 2 cấp
 * ============================================
 */

import express from 'express';
import {
  getAllCategories,
  getCategoryBySlug
} from '../controllers/category.js';

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

export default router;
