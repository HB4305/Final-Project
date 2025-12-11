import { X, SlidersHorizontal } from 'lucide-react';

/**
 * Filter Panel Component
 * Sidebar filter với category và price range
 */
const FilterPanel = ({ 
  categories = [], 
  selectedCategory, 
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceChange,
  onReset,
  isVisible,
  onToggle
}) => {
  return (
    <div className={`${isVisible ? 'block' : 'hidden'} lg:block`}>
      <div className="bg-background border border-border rounded-lg p-6 sticky top-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Bộ lọc
          </h2>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition"
            aria-label="Đóng bộ lọc"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">Danh mục</h3>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-border my-6" />

        {/* Price Range Filter */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">Khoảng giá</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Giá tối thiểu
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => onPriceChange('min', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Giá tối đa
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => onPriceChange('max', e.target.value)}
                placeholder="Không giới hạn"
                min="0"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button 
          onClick={onReset}
          className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
