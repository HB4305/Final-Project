import { useState, useMemo, useEffect, useCallback } from 'react';
import Navigation from '../../components/navigation';
import productService from '../services/productService.js';
import categoryService from '../services/categoryService.js';

import {
  ProductGrid,
  FilterSidebar,
  SearchHeader,
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
  transformProductData,
  buildCategoryMap,
  filterProducts,
  sortProducts
} from './_components';

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

  const toggleWatchlist = useCallback((productId) => {
    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(productId)) {
        newWatchlist.delete(productId);
      } else {
        newWatchlist.add(productId);
      }
      return newWatchlist;
    });
  }, []);

  return { watchlist, toggleWatchlist };
};

const useFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [showFilters, setShowFilters] = useState(false);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('newest');
    setPriceRange([0, Infinity]);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  return {
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
    resetFilters
  };
};


export default function ProductsPage() {
  // Auth state (có thể chuyển sang context sau)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
    resetFilters
  } = useFilters();

  // Combine errors
  const error = categoryError || productError;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      searchQuery,
      selectedCategory,
      priceRange,
      categoryMap
    });
    return sortProducts(filtered, sortBy);
  }, [products, searchQuery, selectedCategory, sortBy, priceRange, categoryMap]);

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner message="Loading products..." />;
    }

    if (filteredProducts.length === 0) {
      return <EmptyState />;
    }

    return (
      <ProductGrid
        products={filteredProducts}
        watchlist={watchlist}
        onToggleWatchlist={toggleWatchlist}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        isLoggedIn={isLoggedIn} 
        setIsLoggedIn={setIsLoggedIn} 
        currentUser={currentUser} 
        setCurrentUser={setCurrentUser} 
      />

      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refetch}
        onToggleFilters={toggleFilters}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
            <div className="mb-6 flex justify-between items-center">
              <p className="text-muted-foreground text-sm">
                Showing <span className="font-semibold">{filteredProducts.length}</span> of{' '}
                <span className="font-semibold">{products.length}</span> products
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
