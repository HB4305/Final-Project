import express from "express";
import {
  cancelOrder,
  confirmDelivery,
  confirmPayment,
  createOrderFromAuction,
  getChatMessages,
  getMyOrders,
  getOrderByAuctionId,
  markAsShipped,
  rateTransaction,
  sendChatMessage,
  submitPaymentInfo,
} from "../controllers/order.js";
import { authenticate } from "../middlewares/auth.js";
import { validateIdParam } from "../middlewares/validation.js";

const router = express.Router();

// Create order
router.post("/create-from-auction", authenticate, createOrderFromAuction);

// Get orders
router.get("/my-orders", authenticate, getMyOrders);
router.get(
  "/by-auction/:auctionId",
  authenticate,
  validateIdParam("auctionId"),
  getOrderByAuctionId
);

// 4 steps
router.post(
  "/:orderId/submit-payment",
  authenticate,
  validateIdParam("orderId"),
  submitPaymentInfo
);
router.post(
  "/:orderId/confirm-payment",
  authenticate,
  validateIdParam("orderId"),
  confirmPayment
);
router.post(
  "/:orderId/mark-shipped",
  authenticate,
  validateIdParam("orderId"),
  markAsShipped
);
router.post(
  "/:orderId/confirm-delivery",
  authenticate,
  validateIdParam("orderId"),
  confirmDelivery
);
router.post(
  "/:orderId/rate",
  authenticate,
  validateIdParam("orderId"),
  rateTransaction
);

// Cancel
router.post(
  "/:orderId/cancel",
  authenticate,
  validateIdParam("orderId"),
  cancelOrder
);

// Chat
router.get(
  "/:orderId/chat",
  authenticate,
  validateIdParam("orderId"),
  getChatMessages
);
router.post(
  "/:orderId/chat/",
  authenticate,
  validateIdParam("orderId"),
  sendChatMessage
);

export default router;