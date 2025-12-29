import express from "express";
import {
  updateAutoExtendSettings,
  getAutoExtendSettings,
  getAllUsers,
  updateUser,
  getAllAuctions,
  getAuditLogs,
  getStatistics,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  removeProduct,
  getAllUpgradeRequests,
  getUpgradeRequestById,
  approveUpgradeRequest,
  rejectUpgradeRequest
} from "../controllers/admin.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/roles.js";
import { USER_ROLES } from "../lib/constants.js";

const router = express.Router();

/**
 * Admin cấu hình tự động gia hạn
 */
router.get(
  "/settings/auto-extend",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getAutoExtendSettings
);

router.put(
  "/settings/auto-extend",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  updateAutoExtendSettings
);

/**
 * User management
 */
router.get(
  "/users",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getAllUsers
);

router.put(
  "/users/:userId",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  updateUser
);

/**
 * Auction management
 */
router.get(
  "/auctions",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getAllAuctions
);

/**
 * Audit logs
 */
router.get(
  "/audit-logs",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getAuditLogs
);

/**
 * Statistics
 */
router.get(
  "/statistics",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getStatistics
);

/**
 * API 4.1: Category Management
 */
router.get(
  "/categories",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getAllCategories
);

router.get(
  "/categories/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getCategoryById
);

router.post(
  "/categories",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  createCategory
);

router.put(
  "/categories/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  updateCategory
);

router.delete(
  "/categories/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  deleteCategory
);

/**
 * API 4.2: Remove Product
 */
router.delete(
  "/products/:productId",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  removeProduct
);

/**
 * API 4.3: Review Upgrade Requests
 */
router.get(
  "/upgrade-requests",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getAllUpgradeRequests
);

router.get(
  "/upgrade-requests/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getUpgradeRequestById
);

router.put(
  "/upgrade-requests/:id/approve",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  approveUpgradeRequest
);

router.put(
  "/upgrade-requests/:id/reject",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  rejectUpgradeRequest
);

export default router;
