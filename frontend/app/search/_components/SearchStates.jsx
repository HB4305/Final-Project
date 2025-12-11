import { Search, Loader2, AlertCircle, PackageSearch } from 'lucide-react';

/**
 * Loading State Component
 * Hiển thị khi đang tải dữ liệu
 */
export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
    <p className="text-lg font-medium">Đang tìm kiếm...</p>
    <p className="text-sm text-muted-foreground mt-2">Vui lòng đợi trong giây lát</p>
  </div>
);

/**
 * Empty State Component
 * Hiển thị khi không tìm thấy kết quả
 */
export const EmptyState = ({ searchQuery, onReset }) => (
  <div className="text-center py-16">
    <PackageSearch className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-xl font-semibold mb-2">Không tìm thấy kết quả</h3>
    <p className="text-muted-foreground mb-4">
      Không có sản phẩm nào phù hợp với từ khóa "{searchQuery}"
    </p>
    <div className="text-left max-w-md mx-auto bg-muted/50 rounded-lg p-4">
      <p className="font-medium mb-2">Gợi ý:</p>
      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
        <li>Kiểm tra lỗi chính tả</li>
        <li>Thử sử dụng từ khóa ngắn hơn hoặc tổng quát hơn</li>
        <li>Thử tìm kiếm với các từ đồng nghĩa</li>
        <li>Bỏ bớt các bộ lọc đang áp dụng</li>
      </ul>
    </div>
    {onReset && (
      <button
        onClick={onReset}
        className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
      >
        Xóa bộ lọc và thử lại
      </button>
    )}
  </div>
);

/**
 * Error State Component
 * Hiển thị khi có lỗi xảy ra
 */
export const ErrorState = ({ error, onRetry }) => (
  <div className="text-center py-16">
    <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
    <h3 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h3>
    <p className="text-muted-foreground mb-4">
      {error || 'Không thể tải kết quả tìm kiếm. Vui lòng thử lại sau.'}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
      >
        Thử lại
      </button>
    )}
  </div>
);

/**
 * No Query State Component
 * Hiển thị khi chưa nhập từ khóa tìm kiếm
 */
export const NoQueryState = () => (
  <div className="text-center py-16">
    <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-xl font-semibold mb-2">Tìm kiếm sản phẩm</h3>
    <p className="text-muted-foreground mb-6">
      Nhập từ khóa để tìm kiếm sản phẩm đấu giá
    </p>
    <div className="text-left max-w-md mx-auto bg-muted/50 rounded-lg p-4">
      <p className="font-medium mb-2">Bạn có thể tìm theo:</p>
      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
        <li>Tên sản phẩm (VD: iPhone 15, Đồng hồ Rolex)</li>
        <li>Mô tả sản phẩm</li>
        <li>Danh mục (VD: Điện tử, Thời trang)</li>
        <li>Tên người bán</li>
      </ul>
    </div>
  </div>
);

/**
 * Results Header Component
 * Hiển thị số lượng kết quả tìm kiếm
 */
export const ResultsHeader = ({ total, searchQuery, currentPage, totalPages }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
    <div>
      <h2 className="text-lg font-semibold">
        Tìm thấy <span className="text-primary">{total}</span> kết quả
        {searchQuery && (
          <span className="text-muted-foreground font-normal">
            {' '}cho "{searchQuery}"
          </span>
        )}
      </h2>
    </div>
    {totalPages > 1 && (
      <p className="text-sm text-muted-foreground">
        Trang {currentPage} / {totalPages}
      </p>
    )}
  </div>
);
