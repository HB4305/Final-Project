// SERVICE: Watchlist Service - Quản lý sản phẩm yêu thích

import api from "./api";

/**
 * Lấy danh sách sản phẩm yêu thích
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getWatchlist = async (params = {}) => {
  const response = await api.get("/watchlist", { params });
  return response.data;
};

/**
 * Thêm sản phẩm vào yêu thích
 * @param {string} productId
 * @returns {Promise}
 */
export const addToWatchlist = async (productId) => {
  const response = await api.post(`/watchlist/${productId}`);
  return response.data;
};

/**
 * Xoá sản phẩm khỏi yêu thích
 * @param {string} productId
 * @returns {Promise}
 */
export const removeFromWatchlist = async (productId) => {
  const response = await api.delete(`/watchlist/${productId}`);
  return response.data;
};

/**
 * Kiểm tra sản phẩm có trong watchlist không
 * @param {string} productId
 * @returns {Promise}
 */
export const checkWatchlist = async (productId) => {
  const response = await api.get(`/watchlist/check/${productId}`);
  return response.data;
};

const watchlistService = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
};

export default watchlistService;
