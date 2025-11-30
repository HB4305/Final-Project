// ROUTES: User Auction Activity Routes

import express from "express";
import {
  getParticipatingAuctions,
  getWonAuctions,
  getSellingAuctions,
  getSoldAuctions,
} from "../controllers/userAuction.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

/**
 * GET /api/user/auctions/participating
 * Danh sách sản phẩm đang tham gia đấu giá
 */
router.get("/participating", authenticate, getParticipatingAuctions);

/**
 * GET /api/user/auctions/won
 * Danh sách sản phẩm đã thắng đấu giá
 */
router.get("/won", authenticate, getWonAuctions);

/**
 * GET /api/user/auctions/selling
 * Danh sách sản phẩm đang bán (seller)
 */
router.get("/selling", authenticate, getSellingAuctions);

/**
 * GET /api/user/auctions/sold
 * Danh sách sản phẩm đã bán (seller)
 */
router.get("/sold", authenticate, getSoldAuctions);

export default router;
