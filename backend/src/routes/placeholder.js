// ============================================
// ROUTES: Placeholder cho các routes khác
// ============================================

import express from 'express';

const router = express.Router();

/**
 * TODO: Product routes
 * POST /api/products - Tạo sản phẩm mới
 * GET /api/products - Lấy danh sách sản phẩm
 * GET /api/products/:productId - Lấy chi tiết sản phẩm
 * PUT /api/products/:productId - Cập nhật sản phẩm
 * DELETE /api/products/:productId - Xoá sản phẩm
 * POST /api/products/:productId/questions - Đặt câu hỏi
 * POST /api/products/:productId/questions/:questionId/answer - Trả lời câu hỏi
 * GET /api/products/:productId/questions - Lấy danh sách câu hỏi
 */

/**
 * TODO: Order routes
 * GET /api/orders/:orderId - Lấy chi tiết đơn hàng
 * PUT /api/orders/:orderId/status - Cập nhật trạng thái
 * POST /api/orders/:orderId/payment-proof - Gửi hoá đơn thanh toán
 * POST /api/orders/:orderId/confirm-payment - Xác nhận nhận tiền
 * POST /api/orders/:orderId/confirm-delivery - Xác nhận nhận hàng
 * POST /api/orders/:orderId/cancel - Hủy đơn hàng
 * GET /api/orders - Lấy danh sách đơn hàng của user
 * POST /api/orders/:orderId/messages - Chat với buyer/seller
 */

/**
 * TODO: Admin routes
 * GET /api/admin/categories - Lấy danh sách danh mục
 * POST /api/admin/categories - Tạo danh mục
 * PUT /api/admin/categories/:categoryId - Cập nhật danh mục
 * DELETE /api/admin/categories/:categoryId - Xoá danh mục
 * GET /api/admin/users - Lấy danh sách người dùng
 * GET /api/admin/users/:userId - Lấy chi tiết user
 * POST /api/admin/users/:userId/ban - Cấm user
 * GET /api/admin/upgrade-requests - Lấy danh sách xin nâng cấp
 * POST /api/admin/upgrade-requests/:requestId/approve - Duyệt nâng cấp
 * POST /api/admin/upgrade-requests/:requestId/reject - Từ chối nâng cấp
 * GET /api/admin/settings - Lấy cấu hình hệ thống
 * PUT /api/admin/settings - Cập nhật cấu hình
 * GET /api/admin/products - Lấy danh sách sản phẩm (quản lý)
 * DELETE /api/admin/products/:productId - Gỡ bỏ sản phẩm
 */

/**
 * TODO: User routes
 * PUT /api/users/:userId - Cập nhật profile
 * GET /api/users/:userId - Lấy profile
 * GET /api/users/:userId/auctions - Lấy danh sách auctions của seller
 * GET /api/users/:userId/orders - Lấy danh sách orders
 * POST /api/users/:userId/request-upgrade - Xin nâng cấp thành seller
 */

/**
 * TODO: Watchlist routes
 * POST /api/watchlist/:productId - Thêm vào watchlist
 * DELETE /api/watchlist/:productId - Xoá khỏi watchlist
 * GET /api/watchlist - Lấy danh sách watchlist của user
 */

/**
 * TODO: AutoBid routes
 * POST /api/autobids/:auctionId - Tạo auto-bid
 * PUT /api/autobids/:autoBidId - Cập nhật auto-bid
 * DELETE /api/autobids/:autoBidId - Xoá auto-bid
 * GET /api/autobids/:auctionId - Lấy thông tin auto-bid của user
 */

export default router;
