import { useState, useEffect, useCallback } from 'react';
import productService from '../../services/productService.js';

/**
 * Hook quản lý countdown timer real-time
 */
export const useCountdown = (endAt) => {
  const [timeLeft, setTimeLeft] = useState({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    isEnded: true 
  });

  useEffect(() => {
    if (!endAt) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isEnded: false
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  return timeLeft;
};

/**
 * Hook fetch product detail
 */
export const useProductDetail = (productId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async (isBackground = false) => {
    if (!productId) return;
    
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      // Only increment view if it's NOT a background fetch
      const response = await productService.getProductById(productId, { 
        incrementView: !isBackground 
      });
      
      if (response.success) {
        setProduct(response.data);
      } else {
        setError(response.error || 'Không thể tải sản phẩm');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct(false); // Initial load with loading state
    
    // Poll for updates every 3 seconds silently (no loading state)
    const interval = setInterval(() => fetchProduct(true), 3000);
    return () => clearInterval(interval);
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
};
