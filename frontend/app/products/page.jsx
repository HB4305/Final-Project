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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getAllProducts();
      
      if (response.success) {
        const transformedProducts = response.data.map(transformProductData);
        setProducts(transformedProducts);
      } else {
        setError(response.error || 'Failed to load products');
      }
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState(new Set());

  useEffect(() => {
    const loadWatchlist = async () => {
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
  }, []);

  const toggleWatchlist = useCallback(async (productId) => {
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
      await watchlistService.toggleWatchlist(productId);
    } catch (error) {
      console.error("Error toggling watchlist:", error);
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
  }, []);

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

  // Filter products
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      priceRange,
      categoryMap
    });
    
    return sortProducts(filtered, sortBy);
  }, [products, searchQuery, selectedCategory, selectedSubcategory, priceRange, categoryMap, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

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
            totalItems={filteredProducts.length}
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
            <div className="mb-6 flex justify-between items-center bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm">
                Hiển thị <span className="font-bold text-gray-200">{paginatedProducts.length}</span> / {' '}
                <span className="font-bold text-gray-200">{filteredProducts.length}</span> sản phẩm
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
