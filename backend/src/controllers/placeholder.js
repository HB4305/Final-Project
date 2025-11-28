import { catchAsync } from '../utils/errors.js';

/**
 * Controller user.js - Quản lý profile người dùng
 * TODO: Cần implement các hàm:
 * - updateProfile: cập nhật thông tin cá nhân
 * - getProfile: lấy profile của user
 * - getUserAuctions: lấy danh sách auctions của seller
 * - getUserOrders: lấy danh sách orders của buyer
 */
export const updateProfile = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', message: 'TODO: implement' });
});

/**
 * Controller product.js - Quản lý sản phẩm
 * TODO: Cần implement các hàm:
 * - createProduct: tạo sản phẩm mới
 * - getProducts: lấy danh sách sản phẩm
 * - getProductDetail: lấy chi tiết sản phẩm
 * - updateProduct: cập nhật sản phẩm
 * - deleteProduct: xoá sản phẩm
 * - askQuestion: đặt câu hỏi
 * - answerQuestion: trả lời câu hỏi
 * - getQuestions: lấy danh sách câu hỏi
 */
export const createProduct = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', message: 'TODO: implement' });
});

/**
 * Controller order.js - Quản lý đơn hàng
 * TODO: Cần implement các hàm:
 * - getOrderDetail: lấy chi tiết đơn hàng
 * - updateOrderStatus: cập nhật trạng thái đơn hàng
 * - submitPaymentProof: gửi hoá đơn thanh toán
 * - confirmPayment: xác nhận nhận tiền
 * - confirmDelivery: xác nhận nhận hàng
 * - cancelOrder: hủy đơn hàng
 * - getUserOrders: lấy danh sách đơn hàng của user
 * - chatWithBuyer: chat với buyer
 */
export const getOrderDetail = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', message: 'TODO: implement' });
});

/**
 * Controller admin.js - Quản lý admin
 * TODO: Cần implement các hàm:
 * - getCategories: lấy danh sách danh mục
 * - createCategory: tạo danh mục
 * - updateCategory: cập nhật danh mục
 * - deleteCategory: xoá danh mục (kiểm tra không có sản phẩm)
 * - getUsers: lấy danh sách người dùng
 * - getUserDetail: lấy chi tiết user
 * - banUser: cấm user
 * - getUpgradeRequests: lấy danh sách xin nâng cấp
 * - approveUpgrade: duyệt nâng cấp
 * - rejectUpgrade: từ chối nâng cấp
 * - getSystemSettings: lấy cấu hình hệ thống
 * - updateSystemSettings: cập nhật cấu hình
 */
export const getCategories = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', message: 'TODO: implement' });
});
