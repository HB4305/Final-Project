import { Search, Clock, ArrowUpDown, TrendingUp } from 'lucide-react';

/**
 * Sort Options
 * Các tùy chọn sắp xếp cho kết quả tìm kiếm
 */
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Độ liên quan', icon: Search },
  { value: 'ending_soon', label: 'Sắp kết thúc', icon: Clock },
  { value: 'price_asc', label: 'Giá: Thấp → Cao', icon: ArrowUpDown },
  { value: 'price_desc', label: 'Giá: Cao → Thấp', icon: ArrowUpDown },
  { value: 'most_bids', label: 'Nhiều lượt đấu giá', icon: TrendingUp },
];

/**
 * Items Per Page Options
 * Các tùy chọn số lượng item trên mỗi trang
 */
export const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48];

/**
 * Fallback Image
 * URL ảnh mặc định khi không có ảnh sản phẩm
 */
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop";

/**
 * Minimum Search Length
 * Số ký tự tối thiểu để thực hiện tìm kiếm
 */
export const MIN_SEARCH_LENGTH = 2;

/**
 * Ending Soon Hours Threshold
 * Số giờ để xác định sản phẩm "sắp kết thúc"
 */
export const ENDING_SOON_HOURS = 24;

/**
 * Hot Bids Threshold
 * Số lượt đấu giá để xác định sản phẩm "hot"
 */
export const HOT_BIDS_THRESHOLD = 10;

/**
 * Default Pagination
 * Giá trị mặc định cho phân trang
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  totalPages: 1,
  total: 0,
};
