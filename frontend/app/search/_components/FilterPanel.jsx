import { X, Filter, RotateCcw, ChevronDown } from 'lucide-react';

/**
 * Filter Panel Component
 * Sidebar filter với category và price range
 * Matched style with Products FilterSidebar for consistency
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
      <div className="glass-card border border-gray-200 dark:border-white/10 rounded-2xl p-6 sticky top-24 shadow-xl bg-white/50 dark:bg-transparent backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg flex items-center gap-2 text-white">
            <Filter className="w-5 h-5 text-primary" />
            Bộ lọc
          </h2>
          <div className="flex items-center gap-2">
              <button 
                onClick={onReset}
                className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                title="Đặt lại bộ lọc"
              >
                  <RotateCcw className="w-3 h-3" /> Đặt lại
              </button>
              <button
                onClick={onToggle}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
          </div>
        </div>

        {/* Category Filter - Button List Style */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-4 text-gray-200">Danh mục</h3>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <button
               onClick={() => onCategoryChange("")}
               className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium flex items-center justify-between group ${
                 !selectedCategory
                   ? 'bg-primary text-white shadow-lg shadow-primary/25'
                   : 'hover:bg-white/10 text-gray-400 hover:text-white'
               }`}
             >
               Tất cả danh mục
               {!selectedCategory && <ChevronDown className="w-4 h-4 -rotate-90" />}
             </button>
            {categories.map((cat) => (
              <div key={cat._id}>
                <button
                  onClick={() => onCategoryChange(cat._id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium flex items-center justify-between group ${
                    selectedCategory === cat._id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'hover:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.name}
                  {(selectedCategory === cat._id || (cat.children && cat.children.some(c => c._id === selectedCategory))) && (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {/* Render children for search filter */}
                {(selectedCategory === cat._id || (cat.children && cat.children.some(c => c._id === selectedCategory))) && 
                 cat.children && cat.children.length > 0 && (
                  <div className="ml-4 mt-1 border-l border-white/10 pl-2 space-y-1">
                     {cat.children.map((child) => (
                       <button
                         key={child._id}
                         onClick={(e) => {
                           e.stopPropagation();
                           onCategoryChange(child._id);
                         }}
                         className={`w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium ${
                           selectedCategory === child._id
                             ? 'text-primary'
                             : 'text-gray-500 hover:text-gray-300'
                         }`}
                       >
                         {child.name}
                       </button>
                     ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10 my-6" />

        {/* Price Range Filter - Side by Side */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-4 text-gray-200">Khoảng giá</h3>
          <div className="flex items-center gap-2">
               <div className="relative flex-1">
                 <input
                   type="text"
                   value={minPrice ? parseInt(minPrice).toLocaleString('vi-VN') : ''}
                   onChange={(e) => {
                     const val = e.target.value.replace(/\./g, '');
                     if (!isNaN(val)) onPriceChange('min', val);
                   }}
                   placeholder="Tối thiểu"
                   className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-500 font-bold"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold pointer-events-none">VNĐ</span>
               </div>
               <span className="text-gray-400 font-bold">-</span>
               <div className="relative flex-1">
                 <input
                   type="text"
                   value={maxPrice ? parseInt(maxPrice).toLocaleString('vi-VN') : ''}
                   onChange={(e) => {
                     const val = e.target.value.replace(/\./g, '');
                     if (!isNaN(val)) onPriceChange('max', val);
                   }}
                   placeholder="Tối đa"
                   className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-500 font-bold"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold pointer-events-none">VNĐ</span>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
