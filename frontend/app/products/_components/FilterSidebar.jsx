import { SORT_OPTIONS } from './utils';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';

const FilterSidebar = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  onReset,
  isVisible = true
}) => {
  return (
    <div className={`${isVisible ? 'block' : 'hidden'} lg:block transition-all duration-300 ease-in-out`}>
      <div className="glass-card border border-white/10 rounded-2xl p-6 sticky top-24 shadow-xl">
        <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2 text-white">
                <Filter className="w-5 h-5 text-primary" /> Bộ lọc
            </h2>
            <button 
                onClick={onReset}
                className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
            >
                <RotateCcw className="w-3 h-3" /> Reset
            </button>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h3 className="font-bold text-sm mb-4 text-gray-200">Danh mục</h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium flex items-center justify-between group ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
                {selectedCategory === cat && <ChevronDown className="w-4 h-4 -rotate-90" />}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10 my-6" />

        {/* Price Range */}
        <div className="mb-8">
          <h3 className="font-bold text-sm mb-4 text-gray-200">Khoảng giá</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    value={priceRange[0] === Infinity ? '' : priceRange[0]}
                    onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                    placeholder="Min"
                    className="w-full pl-6 pr-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-500"
                  />
              </div>
              <span className="text-gray-400">-</span>
              <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    value={priceRange[1] === Infinity ? '' : priceRange[1]}
                    onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || Infinity])}
                    placeholder="Max"
                    className="w-full pl-6 pr-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-500"
                  />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 my-6" />

        {/* Sort */}
        <div>
          <h3 className="font-bold text-sm mb-4 text-gray-200">Sắp xếp theo</h3>
          <div className="relative">
             <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full appearance-none px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer font-medium text-gray-200"
            >
                {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900 text-gray-200">
                    {opt.label}
                </option>
                ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
