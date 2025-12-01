// ROUTES: Transaction Management Routes

import express from "express";
import {
  cancelTransaction,
  updateTransactionStatus,
  getTransactionDetail,
} from "../controllers/transaction.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

/**
 * POST /api/transactions/:auctionId/cancel
 * Hủy giao dịch và tự động đánh giá -1
 */
router.post("/:auctionId/cancel", authenticate, cancelTransaction);

/**
 * PUT /api/transactions/:auctionId/status
 * Cập nhật trạng thái giao dịch
 */
router.put("/:auctionId/status", authenticate, updateTransactionStatus);

/**
 * GET /api/transactions/:auctionId
 * Xem chi tiết giao dịch
 */
router.get("/:auctionId", authenticate, getTransactionDetail);

export default router;
