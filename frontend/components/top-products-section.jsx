import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Clock, Heart, Gavel } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import productService from "../app/services/productService";
import watchlistService from "../app/services/watchlistService";
import { useAuth } from "../app/context/AuthContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop";

/**
 * Component hiển thị Top 5 sản phẩm
 * Gồm 3 nhóm: Gần kết thúc, Nhiều lượt ra giá, Giá cao nhất
 */
export default function TopProductsSection() {
  const { isLoggedIn } = useAuth();
  const [topProducts, setTopProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({});

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await productService.getTopProducts();
        if (response.success) {
          setTopProducts(response.data);
        } else {
          setError(response.error || "Lỗi khi tải sản phẩm");
        }
      } catch (err) {
        console.error("Failed to fetch top products:", err);
        setError(err?.message || "Lỗi khi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  // Cập nhật thời gian còn lại mỗi giây
  useEffect(() => {
    if (!topProducts) return;

    const updateTimer = () => {
      const remaining = {};
      const allProducts = [
        ...(topProducts.endingSoon || []),
        ...(topProducts.mostBids || []),
        ...(topProducts.highestPrice || []),
      ];

      allProducts.forEach((product) => {
        if (product.endAt) {
          remaining[product.auctionId] = productService.calculateTimeRemaining(
            product.endAt
          );
        }
      });

      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [topProducts]);

  // Load watchlist status
  const [watchlist, setWatchlist] = useState(new Set());

  // Function to reload watchlist
  const loadWatchlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWatchlist(new Set());
      return;
    }

    try {
      const response = await watchlistService.getWatchlist({
        page: 1,
        limit: 100,
      });
      if (response.success) {
        const watchedIds = new Set(
          response.data.watchlist
            .map((item) => item.productId?._id || item.productId)
            .filter(Boolean)
        );
        setWatchlist(watchedIds);
      }
    } catch (error) {
      console.error("Failed to load watchlist", error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadWatchlist();

    // Add event listener for focus to reload watchlist when user comes back to tab
    window.addEventListener("focus", loadWatchlist);
    return () => window.removeEventListener("focus", loadWatchlist);
  }, [loadWatchlist]);

  if (loading) {
    return (
      <div className="space-y-12">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-8 w-48 mb-6 bg-white/5" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-[340px] w-full">
                  <Skeleton className="h-48 w-full rounded-t-2xl mb-4 bg-white/5" />
                  <Skeleton className="h-6 w-3/4 mb-2 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Section: Gần kết thúc */}
      {topProducts?.endingSoon && topProducts.endingSoon.length > 0 && (
        <TopProductsGroup
          title="🔥 Gần Kết Thúc"
          subtitle="Các phiên đấu giá sắp kết thúc"
          products={topProducts.endingSoon}
          timeRemaining={timeRemaining}
          watchlist={watchlist}
          onWatchlistChange={loadWatchlist}
        />
      )}

      {/* Section: Nhiều lượt ra giá */}
      {topProducts?.mostBids && topProducts.mostBids.length > 0 && (
        <TopProductsGroup
          title="🎯 Nhiều Lượt Ra Giá Nhất"
          subtitle="Những sản phẩm được quan tâm nhất"
          products={topProducts.mostBids}
          timeRemaining={timeRemaining}
          watchlist={watchlist}
          onWatchlistChange={loadWatchlist}
        />
      )}

      {/* Section: Giá cao nhất */}
      {topProducts?.highestPrice && topProducts.highestPrice.length > 0 && (
        <TopProductsGroup
          title="💎 Giá Cao Nhất"
          subtitle="Những sản phẩm có giá cao"
          products={topProducts.highestPrice}
          timeRemaining={timeRemaining}
          watchlist={watchlist}
          onWatchlistChange={loadWatchlist}
        />
      )}
    </div>
  );
}

function TopProductsGroup({
  title,
  subtitle,
  products,
  timeRemaining,
  watchlist,
  onWatchlistChange,
}) {
  return (
    <div className="rounded-2xl overflow-hidden glass border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none bg-white/50 dark:bg-transparent">
      {/* Header */}
      <div className="bg-white/40 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 px-6 py-4 backdrop-blur-3xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{subtitle}</p>
      </div>

      {/* Products Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.auctionId}
            product={product}
            timeRemaining={timeRemaining[product.auctionId]}
            isWatchlisted={watchlist.has(
              product.product?.productId || product.auctionId
            )}
            onWatchlistChange={onWatchlistChange}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  timeRemaining,
  isWatchlisted,
  onWatchlistChange,
}) {
  const [isFavorite, setIsFavorite] = useState(isWatchlisted);

  useEffect(() => {
    setIsFavorite(isWatchlisted);
  }, [isWatchlisted]);

  const time = timeRemaining || {};

  const handleToggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);

    const targetId = product.product?.productId || product.auctionId;

    try {
      if (newStatus) {
        await watchlistService.addToWatchlist(targetId);
      } else {
        await watchlistService.removeFromWatchlist(targetId);
      }

      if (onWatchlistChange) onWatchlistChange();
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      // Revert if failed
      setIsFavorite(!newStatus);
    }
  };

  return (
    <div className="group cursor-pointer glass-card rounded-2xl bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300 overflow-hidden relative border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-lg">
      {/* Product Image */}
      <div className="relative h-48 overflow-hidden">
        <Link
          to={`/product/${product.product?.productId}`}
          className="block w-full h-full"
        >
          <img
            src={product.product?.image || FALLBACK_IMAGE}
            alt={product.product?.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              e.target.src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>

        {/* Favorite Button */}
        <button
          onClick={handleToggleWatchlist}
          className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/40 backdrop-blur rounded-full hover:bg-white dark:hover:bg-black/60 transition z-10 border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <Heart
            size={16}
            className={
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-white"
            }
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link
          to={`/product/${product.product?.productId}`}
        >
          {/* Title */}
          <h3 className="font-bold text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-primary transition mb-2 min-h-[3rem]">
            {product.product?.title}
          </h3>

          <div className="flex items-end justify-between mt-2">
            <div>
              {/* Current Price */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Hiện tại</p>
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                {productService.formatPrice(product.currentPrice)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
            {/* Bid Count */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Gavel size={14} className="text-primary" />
              <span>{product.bidCount} lượt</span>
            </div>

            {/* Time Remaining */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Clock size={14} className={time.isEnded ? "text-red-500" : "text-orange-500 dark:text-orange-400"} />
              <span className={time.isEnded ? "text-red-500" : "text-orange-600 dark:text-orange-400"}>
                {time.isEnded ? (
                  "Kết thúc"
                ) : (
                  <>
                    {time.days}d {time.hours}h {time.minutes}m
                  </>
                )}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
