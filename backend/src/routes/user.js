// ROUTES: User Routes

import express from "express";
import {
  getUserRatingSummary,
  getUserRatings,
  getUserProfile,
  submitUpgradeRequest,
  getUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest
} from "../controllers/user.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

/**
 * GET /api/users/me/profile
 * Lấy profile của user hiện tại
 */
router.get("/me/profile", authenticate, getUserProfile);

/**
 * GET /api/users/me/ratings/summary
 * Lấy rating summary của user hiện tại
 */
router.get("/me/ratings/summary", authenticate, getUserRatingSummary);

/**
 * GET /api/users/me/ratings
 * Lấy danh sách ratings của user hiện tại
 */
router.get("/me/ratings", authenticate, getUserRatings);

/**
 * GET /api/users/:userId/profile
 * Lấy profile của user khác (public)
 */
router.get("/:userId/profile", getUserProfile);

/**
 * GET /api/users/:userId/ratings/summary
 * Lấy rating summary của user khác (public)
 */
router.get("/:userId/ratings/summary", getUserRatingSummary);

/**
 * GET /api/users/:userId/ratings
 * Lấy danh sách ratings của user khác (public)
 */
router.get("/:userId/ratings", getUserRatings);

/**
 * GET /api/users/upgrade-requests
 * Lấy danh sách upgrade requests
 */
router.get("/upgrade-requests", authenticate, getUpgradeRequests);

/**
 * POST /api/users/upgrade-request
 * Bidder submit upgrade request to seller
 */
router.post("/upgrade-request", authenticate, submitUpgradeRequest);

/**
 * PUT /api/users/upgrade-requests/:requestId/approve
 * Approve upgrade request
 */
router.put("/upgrade-requests/:requestId/approve", authenticate, approveUpgradeRequest);

/**
 * PUT /api/users/upgrade-requests/:requestId/reject
 * Reject upgrade request
 */
router.put("/upgrade-requests/:requestId/reject", authenticate, rejectUpgradeRequest);

export default router;
