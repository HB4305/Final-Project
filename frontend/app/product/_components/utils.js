/**
 * Format giá tiền VNĐ
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return 'Chưa có';
  return `${price.toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Thời gian hiển thị badge "Mới đăng" (phút)
 */
export const NEW_PRODUCT_THRESHOLD_MINUTES = 60; // 60 phút = 1 giờ

/**
 * Kiểm tra xem sản phẩm có được đăng trong N phút gần đây không
 */
export const isNewProduct = (createdAt, thresholdMinutes = NEW_PRODUCT_THRESHOLD_MINUTES) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const minutesSinceCreation = (now - created) / (1000 * 60);
  return minutesSinceCreation >= 0 && minutesSinceCreation <= thresholdMinutes;
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

  // If score is already calculated by backend (0-100), use it
  if (typeof rating.score === 'number') {
    let score = rating.score;
    // Normalize 0-1 scale to 0-100
    if (score <= 1 && score > 0) { // Assuming 0-1 scores are positive, not negative.
        score *= 100;
    }
    return Math.round(score);
  }

  const positive = rating.positiveCount || rating.countPositive || seller.positiveRatings || 0;
  const total = rating.totalRatings || rating.totalCount || 
    (seller.positiveRatings || 0) + (seller.neutralRatings || 0) + (seller.negativeRatings || 0);
  
  if (total === 0) return 0;
  return Math.round((positive / total) * 100);
};
