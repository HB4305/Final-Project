export const USER_ROLES = {
  BIDDER: 'bidder',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
};

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
};

export const AUCTION_STATUS = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELLED: 'cancelled'
};

export const ORDER_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',
  SELLER_CONFIRMED_PAYMENT: 'seller_confirmed_payment',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed'
};

export const NOTIFICATION_TYPES = {
  BID_PLACED: 'bid_placed',
  BID_OUTBID: 'bid_outbid',
  AUCTION_ENDED: 'auction_ended',
  BIDDER_REJECTED: 'bidder_rejected',
  QUESTION_ASKED: 'question_asked',
  QUESTION_ANSWERED: 'question_answered',
  ORDER_CREATED: 'order_created',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered'
};

export const RATING_SCORE = {
  POSITIVE: 1,
  NEGATIVE: -1
};

export const RATING_CONTEXT = {
  BUYER_TO_SELLER: 'buyer_to_seller',
  SELLER_TO_BUYER: 'seller_to_buyer',
  POST_TRANSACTION: 'post_transaction'
};

export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  AUCTION_NOT_FOUND: 'AUCTION_NOT_FOUND',
  AUCTION_NOT_ACTIVE: 'AUCTION_NOT_ACTIVE',
  BID_TOO_LOW: 'BID_TOO_LOW',
  BIDDER_REJECTED: 'BIDDER_REJECTED',
  INVALID_INPUT: 'INVALID_INPUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

export const JWT_EXPIRY = {
  ACCESS_TOKEN: '7d',
  REFRESH_TOKEN: '30d'
};
