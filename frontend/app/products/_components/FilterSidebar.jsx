import { SORT_OPTIONS } from './utils';

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
    <div className={`${isVisible ? 'block' : 'hidden'} lg:block`}>
      <div className="bg-background border border-border rounded-lg p-6 sticky top-24">
        <h2 className="font-bold text-lg mb-6">Filters</h2>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">Category</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border my-6" />

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">Price Range</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={priceRange[0] === Infinity ? '' : priceRange[0]}
                onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                placeholder="Min"
                className="flex-1 w-4 px-3 py-2 border border-border rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                value={priceRange[1] === Infinity ? '' : priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || Infinity])}
                placeholder="Max"
                className="flex-1 w-4 px-3 py-2 border border-border rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">Leave empty for no limit</p>
          </div>
        </div>

        <hr className="border-border my-6" />

        {/* Sort */}
        <div>
          <h3 className="font-semibold mb-3 text-sm">Sort By</h3>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={onReset}
          className="w-full mt-6 px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
