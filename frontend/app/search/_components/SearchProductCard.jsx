import { Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FALLBACK_IMAGE } from './constants.js';
import { formatPrice, calculateTimeLeft, isEndingSoon, isHotProduct } from './utils.js';

/**
 * Search Product Card Component
 * Card hiển thị sản phẩm trong kết quả tìm kiếm
 */
const SearchProductCard = ({ product }) => {
  const endingSoon = isEndingSoon(product.auction?.endAt);
  const isHot = isHotProduct(product.auction?.bidCount);
  const displayPrice = product.auction?.currentPrice || product.auction?.startPrice;

  return (
    <Link to={`/product/${product._id}`} className="block">
      <div className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col group">
        {/* Image Section */}
        <div className="relative h-48 bg-muted overflow-hidden">
          <img
            src={product.primaryImageUrl || product.imageUrls?.[0] || FALLBACK_IMAGE}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />
          
          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex gap-2">
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
