import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { MIN_SEARCH_LENGTH, DEFAULT_PAGINATION } from './constants';

/**
 * useSearchParams_Custom Hook
 * Quản lý state tìm kiếm thông qua URL params
 */
export const useSearchParams_Custom = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lấy các giá trị từ URL
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';
  const categoryId = searchParams.get('categoryId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 12;

  // Update params helper
  const updateParams = useCallback((updates) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });

    // Reset page khi thay đổi filter (trừ khi đang thay đổi page)
    if (!updates.hasOwnProperty('page')) {
      newParams.set('page', '1');
    }

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Reset tất cả filters, giữ lại query
  const resetFilters = useCallback(() => {
    setSearchParams({ q: query });
  }, [query, setSearchParams]);

  // Clear functions cho từng filter
  const clearQuery = useCallback(() => {
    updateParams({ q: '' });
  }, [updateParams]);

  const clearCategory = useCallback(() => {
    updateParams({ categoryId: '' });
  }, [updateParams]);

  const clearSort = useCallback(() => {
    updateParams({ sortBy: 'relevance' });
  }, [updateParams]);

  const clearMinPrice = useCallback(() => {
    updateParams({ minPrice: '' });
  }, [updateParams]);

  const clearMaxPrice = useCallback(() => {
    updateParams({ maxPrice: '' });
  }, [updateParams]);

  const clearAll = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return {
    // Values
    query,
    sortBy,
    categoryId,
    minPrice,
    maxPrice,
    page,
    limit,
    // Actions
    updateParams,
    resetFilters,
    clearQuery,
    clearCategory,
    clearSort,
    clearMinPrice,
    clearMaxPrice,
    clearAll,
  };
};

/**
 * useCategories Hook
 * Fetch và quản lý danh sách categories
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getAllCategories();
        
        if (response.success) {
          // Chỉ lấy parent categories (level 1)
          const parentCats = response.data.filter(cat => cat.level === 1);
          setCategories(parentCats);
        } else {
          setError(response.error || 'Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

/**
 * useSearchProducts Hook
 * Fetch kết quả tìm kiếm sản phẩm
 */
export const useSearchProducts = ({ 
  query, 
  sortBy, 
  categoryId, 
  minPrice, 
  maxPrice, 
  page, 
  limit 
}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchProducts = useCallback(async () => {
    // Không search nếu query quá ngắn
    if (!query || query.trim().length < MIN_SEARCH_LENGTH) {
      setProducts([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await productService.searchProducts({
        q: query,
        sortBy,
        categoryId: categoryId || undefined,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        page,
        limit,
      });

      if (response.success) {
        setProducts(response.data || []);
        setPagination({
          page: response.pagination?.page || 1,
          totalPages: response.pagination?.totalPages || 1,
          total: response.pagination?.total || 0,
        });
      } else {
        setError(response.error || 'Search failed');
        setProducts([]);
        setPagination(DEFAULT_PAGINATION);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Đã có lỗi xảy ra khi tìm kiếm');
      setProducts([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [query, sortBy, categoryId, minPrice, maxPrice, page, limit]);

  // Fetch khi dependencies thay đổi
  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    refetch: searchProducts,
  };
};

/**
 * useFilterVisibility Hook
 * Quản lý visibility của filter panel (cho mobile)
 */
export const useFilterVisibility = (initialState = false) => {
  const [isVisible, setIsVisible] = useState(initialState);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(prev => !prev), []);

  return {
    isVisible,
    show,
    hide,
    toggle,
  };
};

/**
 * useDebounce Hook
 * Debounce một giá trị
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
