import { ENDING_SOON_HOURS, HOT_BIDS_THRESHOLD } from './constants';

/**
 * Format Price
 * Format số tiền theo định dạng VNĐ
 * @param {number} price - Giá tiền
 * @returns {string} - Giá tiền đã format
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return 'N/A';
  return `${price.toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Calculate Time Left
 * Tính thời gian còn lại của phiên đấu giá
 * @param {string|Date} endDate - Thời gian kết thúc
 * @returns {string} - Thời gian còn lại dạng text
 */
export const calculateTimeLeft = (endDate) => {
  if (!endDate) return 'N/A';
  
  const end = new Date(endDate);
  const now = new Date();
  
  if (end <= now) return 'Đã kết thúc';
  
  const diff = end - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Is Ending Soon
 * Kiểm tra xem phiên đấu giá có sắp kết thúc không
 * @param {string|Date} endDate - Thời gian kết thúc
 * @returns {boolean}
 */
export const isEndingSoon = (endDate) => {
  if (!endDate) return false;
  const hoursRemaining = (new Date(endDate) - new Date()) / (1000 * 60 * 60);
  return hoursRemaining > 0 && hoursRemaining < ENDING_SOON_HOURS;
};

/**
 * Is Hot Product
 * Kiểm tra xem sản phẩm có đang "hot" không
 * @param {number} bidCount - Số lượt đấu giá
 * @returns {boolean}
 */
export const isHotProduct = (bidCount) => {
  return bidCount > HOT_BIDS_THRESHOLD;
};

/**
 * Get Display Price
 * Lấy giá hiển thị (giá hiện tại hoặc giá khởi điểm)
 * @param {Object} auction - Object auction
 * @returns {number|null}
 */
export const getDisplayPrice = (auction) => {
  if (!auction) return null;
  return auction.currentPrice || auction.startPrice;
};

/**
 * Transform Search Product
 * Chuyển đổi dữ liệu sản phẩm từ API
 * @param {Object} product - Sản phẩm từ API
 * @returns {Object} - Sản phẩm đã transform
 */
export const transformSearchProduct = (product) => {
  return {
    ...product,
    displayPrice: getDisplayPrice(product.auction),
    isEndingSoon: isEndingSoon(product.auction?.endAt),
    isHot: isHotProduct(product.auction?.bidCount),
    timeLeft: calculateTimeLeft(product.auction?.endAt),
  };
};

/**
 * Build Search Query String
 * Tạo query string từ các parameters
 * @param {Object} params - Các parameters
 * @returns {string}
 */
export const buildSearchQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value.toString());
    }
  });
  
  return searchParams.toString();
};
