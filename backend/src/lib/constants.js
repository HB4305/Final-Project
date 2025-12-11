export const USER_ROLES = {
  BIDDER: "bidder",
  SELLER: "seller",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

export const USER_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  BANNED: "banned",
};

export const AUCTION_STATUS = {
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  ENDED: "ended",
  CANCELLED: "cancelled",
};

export const ORDER_STATUS = {
  AWAITING_PAYMENT: "awaiting_payment",
  SELLER_CONFIRMED_PAYMENT: "seller_confirmed_payment",
  SHIPPED: "shipped",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
};

export const NOTIFICATION_TYPES = {
  BID_PLACED: "bid_placed",
  BID_OUTBID: "bid_outbid",
  AUCTION_ENDED: "auction_ended",
  BIDDER_REJECTED: "bidder_rejected",
  QUESTION_ASKED: "question_asked",
  QUESTION_ANSWERED: "question_answered",
  ORDER_CREATED: "order_created",
  PAYMENT_CONFIRMED: "payment_confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
};

export const RATING_SCORE = {
  POSITIVE: 1,
  NEGATIVE: -1,
};

export const RATING_CONTEXT = {
  BUYER_TO_SELLER: "buyer_to_seller",
  SELLER_TO_BUYER: "seller_to_buyer",
  POST_TRANSACTION: "post_transaction",
};

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  AUCTION_NOT_FOUND: "AUCTION_NOT_FOUND",
  AUCTION_NOT_ACTIVE: "AUCTION_NOT_ACTIVE",
  BID_TOO_LOW: "BID_TOO_LOW",
  BIDDER_REJECTED: "BIDDER_REJECTED",
  INVALID_INPUT: "INVALID_INPUT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_OTP: "INVALID_OTP",
  OTP_EXPIRED: "OTP_EXPIRED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
};

export const JWT_EXPIRY = {
  ACCESS_TOKEN: "7d",
  REFRESH_TOKEN: "30d",
};

// ========================================
// PRODUCT & AUCTION VALIDATION CONSTANTS
// ========================================

export const PRODUCT_VALIDATION = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 50,
  MIN_IMAGES: 3,
  MAX_IMAGES: 10,
};

export const AUCTION_VALIDATION = {
  MIN_START_PRICE: 10000,        // 10,000 VND
  MIN_PRICE_STEP: 1000,          // 1,000 VND
  MIN_DURATION_MS: 60 * 60 * 1000,  // 1 hour in milliseconds
  MIN_DURATION_HOURS: 1,
  MAX_DURATION_DAYS: 30,
  NEW_PRODUCT_DAYS: 7,           // Days to mark as "new"
};

export const SORT_OPTIONS = {
  PRODUCTS: ['newest', 'price_asc', 'price_desc', 'ending_soon', 'most_bids'],
  SEARCH: ['relevance', 'price_asc', 'price_desc', 'ending_soon', 'most_bids'],
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
};

export const PLACEHOLDER_IMAGES = {
  PRODUCT: [
    'https://via.placeholder.com/800x600/FF5733/FFFFFF?text=Product+Image+1',
    'https://via.placeholder.com/800x600/33FF57/FFFFFF?text=Product+Image+2',
    'https://via.placeholder.com/800x600/3357FF/FFFFFF?text=Product+Image+3'
  ],
  AVATAR: 'https://via.placeholder.com/150x150/CCCCCC/666666?text=User',
};
