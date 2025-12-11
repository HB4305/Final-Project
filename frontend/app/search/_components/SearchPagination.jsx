import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Search Pagination Component
 * Phân trang cho kết quả tìm kiếm
 */
const SearchPagination = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange 
}) => {
  // Không hiển thị nếu không có dữ liệu
  if (totalPages <= 0) return null;

  // Tính toán phạm vi item đang hiển thị
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Tạo array các số trang để hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiện trang đầu
      pages.push(1);
      
      // Tính start và end cho các trang giữa
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Điều chỉnh nếu ở gần đầu
      if (currentPage <= 3) {
        end = 4;
      }
      
      // Điều chỉnh nếu ở gần cuối
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      // Thêm dấu ... nếu cần
      if (start > 2) {
        pages.push('...');
      }
      
      // Thêm các trang giữa
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Thêm dấu ... nếu cần
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Luôn hiện trang cuối
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-muted/30 rounded-lg">
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Hiển thị <span className="font-semibold text-foreground">{startItem}-{endItem}</span> trong số <span className="font-semibold text-foreground">{totalItems}</span> kết quả
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] h-9 rounded font-medium transition ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Items per page selector */}
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hiển thị</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-border rounded bg-background text-sm"
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
          <span className="text-sm text-muted-foreground">/ trang</span>
        </div>
      )}
    </div>
  );
};

export default SearchPagination;
