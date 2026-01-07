import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FALLBACK_IMAGE } from './constants.js';
import { formatPrice, calculateTimeLeft, isEndingSoon, isHotProduct, isNewProduct } from './utils.js';
import watchlistService from '../../services/watchlistService';
import { useAuth } from '../../context/AuthContext';

/**
 * Search Product Card Component
 * Card hiển thị sản phẩm trong kết quả tìm kiếm
 */
const SearchProductCard = ({ product }) => {
  const { currentUser } = useAuth();
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const endingSoon = isEndingSoon(product.auction?.endAt);
  const isHot = isHotProduct(product.auction?.bidCount);
  const isNew = isNewProduct(product.createdAt);
  const displayPrice = product.auction?.currentPrice || product.auction?.startPrice;

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (currentUser && product?._id) {
        try {
          const response = await watchlistService.checkWatchlist(product._id);
          if (response.success) {
            setIsWatchlisted(response.data.isWatched);
          }
        } catch (error) {
          console.error("Failed to check watchlist status", error);
        }
      }
    };
    checkWatchlistStatus();
  }, [currentUser, product]);

  const toggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert("Vui lòng đăng nhập để thêm vào danh sách yêu thích");
      return;
    }

    try {
      if (isWatchlisted) {
        await watchlistService.removeFromWatchlist(product._id);
        setIsWatchlisted(false);
      } else {
        await watchlistService.addToWatchlist(product._id);
        setIsWatchlisted(true);
      }
    } catch (err) {
      console.error("Watchlist action failed", err);
    }
  };

  return (
    <Link to={`/product/${product._id}`} className="block">
      <div className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col group relative">
        {/* Image Section */}
        <div className="relative h-48 bg-muted overflow-hidden">
          <img
            src={product.primaryImageUrl || product.imageUrls?.[0] || FALLBACK_IMAGE}
            alt={product.title}
            className="w-full h-full object-contain p-2 bg-white group-hover:scale-105 transition duration-300"
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />

          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-2">
            {isNew && (
              <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm animate-pulse">
                <Sparkles className="w-3 h-3" /> Mới đăng
              </span>
            )}
            {endingSoon && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3" /> Sắp kết thúc
              </span>
            )}
            {isHot && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm">
                <TrendingUp className="w-3 h-3" /> Hot
              </span>
            )}
          </div>

          {/* Watchlist Button */}
          <button
            onClick={toggleWatchlist}
            className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all duration-200 group-hover:opacity-100"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${isWatchlisted
                  ? "fill-red-500 text-red-500"
                  : "text-white hover:text-red-400"
                }`}
            />
          </button>

          {/* Relevance Score (nếu có từ full-text search) */}
          {product.score && (
            <div className="absolute bottom-2 right-2">
              <span className="px-2 py-1 bg-primary/90 text-white text-xs font-medium rounded shadow-sm">
                Độ khớp: {Math.round(product.score * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-primary transition">
            {product.title}
          </h3>

          {/* Category */}
          <p className="text-xs text-muted-foreground mb-3">
            {product.category?.name || 'Chưa phân loại'}
          </p>

          {/* Price & Stats */}
          <div className="mt-auto space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Giá hiện tại</p>
              <p className="text-xl font-bold text-primary">
                {formatPrice(displayPrice)}
              </p>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {product.auction?.bidCount || 0} lượt đấu giá
              </span>
              <span className={`font-semibold ${endingSoon ? 'text-red-500' : 'text-orange-500'}`}>
                {/* calculateTimeLeft already returns localized string from utils */}
                {calculateTimeLeft(product.auction?.endAt)}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            Đấu giá ngay
          </button>
        </div>
      </div>
    </Link>
  );
};

export default SearchProductCard;
