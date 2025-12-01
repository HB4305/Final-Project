// SERVICE: Transaction Service - Quản lý giao dịch

import api from "./api";

/**
 * Hủy giao dịch và tự động đánh giá -1
 * @param {string} auctionId
 * @param {string} reason - Lý do hủy (optional)
 * @returns {Promise}
 */
export const cancelTransaction = async (auctionId, reason = null) => {
  const response = await api.post(`/transactions/${auctionId}/cancel`, {
    reason,
  });
  return response.data;
};

/**
 * Cập nhật trạng thái giao dịch
 * @param {string} auctionId
 * @param {string} status - pending, paid, shipped, delivered, cancelled, disputed
 * @returns {Promise}
 */
export const updateTransactionStatus = async (auctionId, status) => {
  const response = await api.put(`/transactions/${auctionId}/status`, {
    status,
  });
  return response.data;
};

/**
 * Xem chi tiết giao dịch
 * @param {string} auctionId
 * @returns {Promise}
 */
export const getTransactionDetail = async (auctionId) => {
  const response = await api.get(`/transactions/${auctionId}`);
  return response.data;
};

const transactionService = {
  cancelTransaction,
  updateTransactionStatus,
  getTransactionDetail,
};

export default transactionService;
