import { X, Filter } from 'lucide-react';
import { SORT_OPTIONS } from './constants.js';
import { formatPrice } from './utils.js';

/**
 * Active Filters Component
 * Hiển thị các bộ lọc đang được áp dụng với khả năng xóa từng filter
 */
const ActiveFilters = ({ 
  searchQuery,
  selectedCategory,
  categories,
  sortBy,
  minPrice,
  maxPrice,
  onRemoveQuery,
  onRemoveCategory,
  onRemoveSort,
  onRemoveMinPrice,
  onRemoveMaxPrice,
  onClearAll 
}) => {
  // Tìm tên category từ ID
  const getCategoryName = (categoryId) => {
    const category = categories?.find(c => c._id === categoryId);
    return category?.name || categoryId;
  };

  // Tìm tên sort option từ value
  const getSortLabel = (sortValue) => {
    const option = SORT_OPTIONS.find(o => o.value === sortValue);
    return option?.label || sortValue;
  };

  // Đếm số filter đang active
  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    sortBy !== 'relevance' && sortBy,
    minPrice,
    maxPrice
  ].filter(Boolean).length;

  // Không hiển thị nếu không có filter nào
  if (activeFiltersCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
      <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <Filter className="w-4 h-4" />
        Đang lọc:
      </span>

      {/* Search Query Tag */}
      {searchQuery && (
        <FilterTag 
          label={`Từ khóa: "${searchQuery}"`} 
          onRemove={onRemoveQuery} 
          variant="primary"
        />
      )}

      {/* Category Tag */}
      {selectedCategory && (
        <FilterTag 
          label={`Danh mục: ${getCategoryName(selectedCategory)}`} 
          onRemove={onRemoveCategory} 
        />
      )}

      {/* Sort Tag (chỉ hiện nếu không phải default) */}
      {sortBy && sortBy !== 'relevance' && (
        <FilterTag 
          label={`Sắp xếp: ${getSortLabel(sortBy)}`} 
          onRemove={onRemoveSort} 
        />
      )}

      {/* Min Price Tag */}
      {minPrice && (
        <FilterTag 
          label={`Giá từ: ${formatPrice(minPrice)}`} 
          onRemove={onRemoveMinPrice} 
        />
      )}

      {/* Max Price Tag */}
      {maxPrice && (
        <FilterTag 
          label={`Giá đến: ${formatPrice(maxPrice)}`} 
          onRemove={onRemoveMaxPrice} 
        />
      )}

      {/* Clear All Button */}
      {activeFiltersCount > 1 && (
        <button
          onClick={onClearAll}
          className="ml-2 text-sm text-red-500 hover:text-red-600 font-medium hover:underline transition"
        >
          Xóa tất cả
        </button>
      )}
    </div>
  );
};

/**
 * Filter Tag Component
 * Tag đơn lẻ cho mỗi filter
 */
const FilterTag = ({ label, onRemove, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-background border border-border text-foreground',
    primary: 'bg-primary/10 border border-primary/30 text-primary'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${variantClasses[variant]}`}>
      {label}
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20 transition"
        title="Xóa bộ lọc này"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
};

export default ActiveFilters;
