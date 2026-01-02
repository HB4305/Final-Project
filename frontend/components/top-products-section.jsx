import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Heart, Gavel } from "lucide-react";
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
  const loadWatchlist = async () => {
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
  };

  useEffect(() => {
    loadWatchlist();

    // Add event listener for focus to reload watchlist when user comes back to tab
    window.addEventListener("focus", loadWatchlist);
    return () => window.removeEventListener("focus", loadWatchlist);
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="space-y-12">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div
                  key={j}
                  className="bg-gray-200 rounded-lg h-64 animate-pulse"
                />
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
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
        <p className="text-blue-100 text-sm">{subtitle}</p>
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
    <div className="group cursor-pointer bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all overflow-hidden relative">
      {/* Product Image */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <Link
          to={`/product/${product.product?.productId || product.auctionId}`}
          className="block w-full h-full"
        >
          <img
            src={product.product?.image || FALLBACK_IMAGE}
            alt={product.product?.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            onError={(e) => {
              e.target.src = FALLBACK_IMAGE;
            }}
          />
        </Link>

        {/* Favorite Button */}
        <button
          onClick={handleToggleWatchlist}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition z-10"
        >
          <Heart
            size={18}
            className={
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            }
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <Link
          to={`/product/${product.product?.productId || product.auctionId}`}
        >
          {/* Title */}
          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-blue-600 pb-1">
            {product.product?.title}
          </h3>

          {/* Current Price */}
          <p className="text-lg font-bold text-red-600 mt-2">
            {productService.formatPrice(product.currentPrice)}
          </p>

          {/* Bid Count */}
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
            <Gavel size={14} />
            <span>{product.bidCount} lượt</span>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center gap-1 text-xs text-orange-600 mt-2 font-medium">
            <Clock size={14} />
            <span>
              {time.isEnded ? (
                <span className="text-red-600">Đã kết thúc</span>
              ) : (
                <>
                  {time.days}d {time.hours}h {time.minutes}m
                </>
              )}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
