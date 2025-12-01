// ROUTES: Watchlist Routes

import express from "express";
import {
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
} from "../controllers/watchlist.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

/**
 * GET /api/watchlist
 * Lấy danh sách sản phẩm yêu thích
 */
router.get("/", authenticate, getUserWatchlist);

/**
 * POST /api/watchlist/:productId
 * Thêm sản phẩm vào yêu thích
 */
router.post("/:productId", authenticate, addToWatchlist);

/**
 * DELETE /api/watchlist/:productId
 * Xoá sản phẩm khỏi yêu thích
 */
router.delete("/:productId", authenticate, removeFromWatchlist);

/**
 * GET /api/watchlist/check/:productId
 * Kiểm tra sản phẩm có trong watchlist không
 */
router.get("/check/:productId", authenticate, checkWatchlist);

export default router;
