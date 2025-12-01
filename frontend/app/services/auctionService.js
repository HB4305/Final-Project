// SERVICE: Auction Service - Quản lý đấu giá của user

import api from "./api";

/**
 * Lấy danh sách sản phẩm đang tham gia đấu giá
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getParticipatingAuctions = async (params = {}) => {
  const response = await api.get("/user/auctions/participating", { params });
  return response.data;
};

/**
 * Lấy danh sách sản phẩm đã thắng đấu giá
 * @param {Object} params - { page, limit, status }
 * @returns {Promise}
 */
export const getWonAuctions = async (params = {}) => {
  const response = await api.get("/user/auctions/won", { params });
  return response.data;
};

/**
 * Lấy danh sách sản phẩm đang bán (seller)
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getSellingAuctions = async (params = {}) => {
  const response = await api.get("/user/auctions/selling", { params });
  return response.data;
};

/**
 * Lấy danh sách sản phẩm đã bán (seller)
 * @param {Object} params - { page, limit, status }
 * @returns {Promise}
 */
export const getSoldAuctions = async (params = {}) => {
  const response = await api.get("/user/auctions/sold", { params });
  return response.data;
};

const auctionService = {
  getParticipatingAuctions,
  getWonAuctions,
  getSellingAuctions,
  getSoldAuctions,
};

export default auctionService;
