import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Heart, Gavel } from "lucide-react";
import productService from "../app/services/productService";

/**
 * Component hiển thị Top 5 sản phẩm
 * Gồm 3 nhóm: Gần kết thúc, Nhiều lượt ra giá, Giá cao nhất
 */
export default function TopProductsSection() {
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
        />
      )}

      {/* Section: Nhiều lượt ra giá */}
      {topProducts?.mostBids && topProducts.mostBids.length > 0 && (
        <TopProductsGroup
          title="🎯 Nhiều Lượt Ra Giá Nhất"
          subtitle="Những sản phẩm được quan tâm nhất"
          products={topProducts.mostBids}
          timeRemaining={timeRemaining}
        />
      )}

      {/* Section: Giá cao nhất */}
      {topProducts?.highestPrice && topProducts.highestPrice.length > 0 && (
        <TopProductsGroup
          title="💎 Giá Cao Nhất"
          subtitle="Những sản phẩm có giá cao"
          products={topProducts.highestPrice}
          timeRemaining={timeRemaining}
        />
      )}
    </div>
  );
}


function TopProductsGroup({ title, subtitle, products, timeRemaining }) {
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
          />
        ))}
      </div>
    </div>
  );
}


function ProductCard({ product, timeRemaining }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const time = timeRemaining || {};

  return (
    <Link to={`/product/${product.product?.productId || product.auctionId}`}>
      <div className="group cursor-pointer bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all overflow-hidden">
        {/* Product Image */}
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          {product.product?.image ? (
            <img
              src={product.product.image}
              alt={product.product?.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition z-10"
          >
            <Heart
              size={18}
              className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-blue-600">
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
        </div>
      </div>
    </Link>
  );
}
