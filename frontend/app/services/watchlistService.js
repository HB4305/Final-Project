// SERVICE: Watchlist Service - Quản lý sản phẩm yêu thích

import api from "./api";

/**
 * Lấy danh sách sản phẩm yêu thích
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getWatchlist = async (params = {}) => {
  try {
    const response = await api.get("/watchlist", { params });
    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch watchlist"
    };
  }
};

/**
 * Thêm sản phẩm vào yêu thích
 * @param {string} productId
 * @returns {Promise}
 */
export const addToWatchlist = async (productId) => {
  try {
    const response = await api.post(`/watchlist/${productId}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    throw error; // Let components handle specific errors or standardize here
  }
};

/**
 * Xoá sản phẩm khỏi yêu thích
 * @param {string} productId
 * @returns {Promise}
 */
export const removeFromWatchlist = async (productId) => {
  try {
    const response = await api.delete(`/watchlist/${productId}`);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm tra sản phẩm có trong watchlist không
 * @param {string} productId
 * @returns {Promise}
 */
export const checkWatchlist = async (productId) => {
  try {
    const response = await api.get(`/watchlist/check/${productId}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message
    };
  }
};

const watchlistService = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
};

export default watchlistService;
