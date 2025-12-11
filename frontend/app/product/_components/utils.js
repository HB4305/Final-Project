/**
 * Format giá tiền VNĐ
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return 'Chưa có';
  return `${price.toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Format ngày giờ đầy đủ
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format ngày ngắn
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

/**
 * Calculate positive rating percentage
 * Supports multiple field name formats from backend
 */
export const calculatePositiveRate = (seller) => {
  if (!seller) return 0;
  
  // Support ratingSummary object or direct fields
  const rating = seller.ratingSummary || seller;
  const positive = rating.positiveCount || rating.countPositive || seller.positiveRatings || 0;
  const total = rating.totalRatings || rating.totalCount || 
    (seller.positiveRatings || 0) + (seller.neutralRatings || 0) + (seller.negativeRatings || 0);
  
  if (total === 0) return 0;
  return Math.round((positive / total) * 100);
};
