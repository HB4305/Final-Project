/**
 * Search Page
 * Trang tìm kiếm sản phẩm với full-text search, lọc và sắp xếp
 * 
 * @features
 * - Full-text search với điểm relevance
 * - Lọc theo danh mục, khoảng giá
 * - Sắp xếp theo: độ liên quan, sắp kết thúc, giá tăng/giảm, lượt đấu giá
 * - Phân trang
 * - URL-based state (shareable, refreshable)
 * - Responsive design
 */

import { Filter } from 'lucide-react';
import Navigation from '../../components/navigation';

// Import tất cả từ _components
import {
  // Hooks
  useSearchParams_Custom,
  useCategories,
  useSearchProducts,
  useFilterVisibility,
  // Components
  SearchInput,
  SortDropdown,
  FilterPanel,
  SearchProductCard,
  SearchPagination,
  ActiveFilters,
  // State Components
  LoadingState,
  EmptyState,
  ErrorState,
  NoQueryState,
  ResultsHeader,
} from './_components';

/**
 * SearchPage Component
 * Main component cho trang tìm kiếm
 */
export default function SearchPage() {
  // Custom hooks để quản lý state
  const {
    query,
    sortBy,
    categoryId,
    minPrice,
    maxPrice,
    page,
    limit,
    updateParams,
    resetFilters,
    clearQuery,
    clearCategory,
    clearSort,
    clearMinPrice,
    clearMaxPrice,
    clearAll,
  } = useSearchParams_Custom();

  const { categories } = useCategories();
  
  const { 
    products, 
    pagination, 
    loading, 
    error, 
    refetch 
  } = useSearchProducts({
    query,
    sortBy,
    categoryId,
    minPrice,
    maxPrice,
    page,
    limit,
  });

  const { 
    isVisible: showFilters, 
    toggle: toggleFilters,
    hide: hideFilters,
  } = useFilterVisibility();

  // === Event Handlers ===
  const handleSearch = (newQuery) => {
    updateParams({ q: newQuery });
  };

  const handleSortChange = (newSort) => {
    updateParams({ sortBy: newSort });
  };

  const handleCategoryChange = (newCategory) => {
    updateParams({ categoryId: newCategory });
  };

  const handlePriceChange = (type, value) => {
    if (type === 'min') {
      updateParams({ minPrice: value });
    } else {
      updateParams({ maxPrice: value });
    }
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage.toString() });
    // Scroll to top khi đổi trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit) => {
    updateParams({ limit: newLimit.toString(), page: '1' });
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  // === Render Content ===
  const renderContent = () => {
    // Loading state
    if (loading) {
      return <LoadingState />;
    }

    // Error state
    if (error) {
      return <ErrorState error={error} onRetry={refetch} />;
    }

    // No query state
    if (!query) {
      return <NoQueryState />;
    }

    // Empty state (có query nhưng không có kết quả)
    if (products.length === 0) {
      return (
        <EmptyState 
          searchQuery={query} 
          onReset={handleResetFilters} 
        />
      );
    }

    // Results
    return (
      <>
        <ResultsHeader
          total={pagination.total}
          searchQuery={query}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
        />

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <SearchProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Pagination */}
        <SearchPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* ===== Search Header ===== */}
      <header className="pt-24 pb-6 bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Tìm kiếm sản phẩm</h1>
          
          {/* Search Bar & Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <SearchInput
              value={query}
              onChange={clearQuery}
              onSubmit={handleSearch}
              isLoading={loading}
            />
            
            <div className="flex gap-2">
              <SortDropdown value={sortBy} onChange={handleSortChange} />
              
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={toggleFilters}
                className="lg:hidden px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium"
              >
                <Filter className="w-5 h-5" />
                Lọc
              </button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="mt-4">
            <ActiveFilters
              searchQuery={query}
              selectedCategory={categoryId}
              categories={categories}
              sortBy={sortBy}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onRemoveQuery={clearQuery}
              onRemoveCategory={clearCategory}
              onRemoveSort={clearSort}
              onRemoveMinPrice={clearMinPrice}
              onRemoveMaxPrice={clearMaxPrice}
              onClearAll={clearAll}
            />
          </div>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filter Sidebar */}
          <aside>
            <FilterPanel
              categories={categories}
              selectedCategory={categoryId}
              onCategoryChange={handleCategoryChange}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onPriceChange={handlePriceChange}
              onReset={handleResetFilters}
              isVisible={showFilters}
              onToggle={hideFilters}
            />
          </aside>

          {/* Results Section */}
          <section className="lg:col-span-3">
            {renderContent()}
          </section>
          
        </div>
      </main>
    </div>
  );
}
