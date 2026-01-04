import { useState, useMemo, useEffect, useCallback } from 'react';
import Navigation from '../../components/navigation';
import productService from '../services/productService.js';
import categoryService from '../services/categoryService.js';
import watchlistService from '../services/watchlistService.js';

import {
  ProductGrid,
  FilterSidebar,
  SearchHeader,
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
  Pagination,
  transformProductData,
  buildCategoryMap,
  filterProducts,
  sortProducts,
} from './_components';
import CategoryBreadcrumb from './_components/CategoryBreadcrumb';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================
// CUSTOM HOOKS
// ============================================
const useCategories = () => {
  const [categories, setCategories] = useState(['All']);
  const [categoryMap, setCategoryMap] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories();

        if (response.success) {
          const allCats = response.data;
          const parentCats = allCats.filter(cat => cat.level === 1);

          setCategories(['All', ...parentCats.map(cat => cat.name)]);
          setCategoryMap(buildCategoryMap(allCats));
        }
      } catch (err) {
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  return { categories, categoryMap, error };
};

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getAllProducts(params);

      if (response.success) {
        const transformedProducts = response.data.map(transformProductData);
        setProducts({
          data: transformedProducts,
          total: response.pagination?.totalProducts || response.pagination?.total || transformedProducts.length
        });
      } else {
        setError(response.error || 'Failed to load products');
      }
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState(new Set());
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const loadWatchlist = async () => {
      // If not logged in, clear watchlist
      if (!isLoggedIn) {
        setWatchlist(new Set());
        return;
      }

      try {
        const response = await watchlistService.getWatchlist({ page: 1, limit: 100 });
        if (response.success) {
          const watchedIds = new Set(
            response.data.watchlist
              .map(item => item.productId?._id || item.productId)
              .filter(Boolean)
          );
          setWatchlist(watchedIds);
        }
      } catch (error) {
        console.error("Failed to load watchlist", error);
      }
    };
    loadWatchlist();
  }, [isLoggedIn]); // Re-run when auth status changes

  const toggleWatchlist = useCallback(async (productId) => {
    if (!isLoggedIn) {
      // Optional: could show toast telling user to login
      return;
    }

    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(productId)) {
        newWatchlist.delete(productId);
      } else {
        newWatchlist.add(productId);
      }
      return newWatchlist;
    });

    try {
      // Check current state to determine action
      // We need to know if we just added or removed it from local state
      // Actually, relying on the 'toggle' implies we don't know the server state? 
      // The service has addToWatchlist and removeFromWatchlist. 
      // The component logic above optimistically toggles.
      // Let's check the previous state by checking if it WAS in the set.
      // But we already updated the state. 
      // safer way:

      // We need to know if we are adding or removing.
      // Since we just toggled the set, check if it IS in the set now.
      // Wait, we can't easily check the 'new' state inside the async call if we used closure.
      // Let's just use the service calls directly based on what we think we did.

      // Actually, looking at the original code: 
      // await watchlistService.toggleWatchlist(productId); 
      // But wait, the service file I read earlier ONLY had add and remove, NOT toggle.
      // File: frontend/app/services/watchlistService.js
      // Exports: getWatchlist, addToWatchlist, removeFromWatchlist, checkWatchlist.
      // The original code in ProductsPage CALLS `toggleWatchlist` which DOES NOT EXIST in the service file I saw.
      // This is another bug!

      // I need to implement the toggle logic properly here.

      // We need to check if it was in the watchlist before the toggle.
      // But we optimistically updated it. 
      // Let's rely on the previous state of the set which we have access to? No.

      // Let's redo this function to be safer.
      const isWatched = watchlist.has(productId);

      if (isWatched) {
        await watchlistService.removeFromWatchlist(productId);
      } else {
        await watchlistService.addToWatchlist(productId);
      }

    } catch (error) {
      console.error("Error toggling watchlist:", error);
      // Revert on error
      setWatchlist(prev => {
        const newWatchlist = new Set(prev);
        if (newWatchlist.has(productId)) {
          newWatchlist.delete(productId);
        } else {
          newWatchlist.add(productId);
        }
        return newWatchlist;
      });
    }
  }, [isLoggedIn, watchlist]); // Need watchlist dependency to know current state

  return { watchlist, toggleWatchlist };
};

const useFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('newest');
    setPriceRange([0, Infinity]);
    setCurrentPage(1);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePriceRangeChange = useCallback((range) => {
    setPriceRange(range);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((items) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    selectedCategory,
    setSelectedCategory: handleCategoryChange,
    sortBy,
    setSortBy: handleSortChange,
    priceRange,
    setPriceRange: handlePriceRangeChange,
    showFilters,
    toggleFilters,
    resetFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage: handleItemsPerPageChange
  };
};


export default function ProductsPage() {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Custom hooks
  const { categories, categoryMap, error: categoryError } = useCategories();
  const { products, loading, error: productError, refetch } = useProducts();
  const { watchlist, toggleWatchlist } = useWatchlist();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    showFilters,
    toggleFilters,
    resetFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage
  } = useFilters();

  const error = categoryError || productError;

  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Sync URL query -> filters
  useEffect(() => {
    if (!location || !location.search) {
      setSelectedCategory('All');
      setSelectedSubcategory(null);
      return;
    }

    const params = new URLSearchParams(location.search);
    const subcategoryParam = params.get('subcategory');
    const categoryParam = params.get('category') || params.get('categoryId');

    if (subcategoryParam) {
      const subName = decodeURIComponent(subcategoryParam);
      setSelectedSubcategory(subName);

      const parentCat = categoryMap[subName];
      if (parentCat) {
        setSelectedCategory(parentCat);
      }
    } else if (categoryParam) {
      const catName = decodeURIComponent(categoryParam);
      setSelectedCategory(catName);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory('All');
      setSelectedSubcategory(null);
    }
  }, [location.search, categoryMap]);

  // Sync filters to API call
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      sortBy: sortBy,
      status: 'active'
    };

    // Note: If we had a direct categoryId from URL, we'd use it.
    // However, the current backend implementation of getAllProducts 
    // doesn't filter by category name string, but the generic list does.
    // For now, let's keep it simple and just fetch base on page/limit/sort.
    // REAL FIX: Backend getAllProducts should support categoryId/name or search.

    refetch(params);
  }, [currentPage, itemsPerPage, sortBy, refetch]);

  // Derived data
  const filteredProducts = useMemo(() => {
    // We still keep client-side filtering for search/category if backend doesn't support them in getAllProducts
    // But pagination is now handled by backend.
    const allProducts = products.data || [];
    const filtered = filterProducts(allProducts, {
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      priceRange,
      categoryMap
    });

    // Sort logic is already in backend for sortBy, but we keep it here for client-side filters
    return sortProducts(filtered, sortBy);
  }, [products.data, searchQuery, selectedCategory, selectedSubcategory, priceRange, categoryMap, sortBy]);

  const totalItems = products.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts; // Already limited if we use getProducts instead of getAllProducts


  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner message="Đang tải sản phẩm..." />;
    }

    if (filteredProducts.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="animate-fade-in">
        <ProductGrid
          products={paginatedProducts}
          watchlist={watchlist}
          onToggleWatchlist={toggleWatchlist}
        />

        {/* Pagination */}
        <div className="mt-12">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <CategoryBreadcrumb selectedCategory={selectedCategory} selectedSubcategory={selectedSubcategory} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refetch}
        onToggleFilters={toggleFilters}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onReset={resetFilters}
            isVisible={showFilters}
          />

          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 flex justify-between items-center bg-white dark:bg-white/5 backdrop-blur rounded-xl p-4 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Hiển thị <span className="font-bold text-gray-900 dark:text-gray-200">{paginatedProducts.length}</span> / {' '}
                <span className="font-bold text-gray-900 dark:text-gray-200">{totalItems}</span> sản phẩm
                {selectedCategory !== 'All' && (
                  <span className="ml-2">
                    trong <span className="text-primary font-medium">"{selectedCategory}"</span>
                  </span>
                )}
              </p>
            </div>

            <ErrorMessage message={error} />
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
