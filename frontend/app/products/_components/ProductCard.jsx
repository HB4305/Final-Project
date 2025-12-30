import { Heart, Clock, TrendingUp, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, FALLBACK_IMAGE, calculateTimeLeft } from './utils';

const ProductCard = ({ product, isWatchlisted, onToggleWatchlist }) => {
  // Tính toán badges
  const isEndingSoon = () => {
    if (!product.auction?.endAt) return false;
    const hoursRemaining = (new Date(product.auction.endAt) - new Date()) / (1000 * 60 * 60);
    return hoursRemaining > 0 && hoursRemaining < 24;
  };

  const isHot = product.bids > 10;

  return (
    <Link to={`/product/${product.id}`}>
      <div className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col group">
        {/* Image Section */}
        <div className="relative h-48 bg-muted overflow-hidden">
          <img
            src={product.image || FALLBACK_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-2">
            {isEndingSoon() && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1">
                <Clock className="w-3 h-3" /> Sắp kết thúc
              </span>
            )}
            {isHot && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Hot
              </span>
            )}
          </div>

          {/* Watchlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleWatchlist(product.id);
            }}
            className="absolute top-2 right-2 p-2 bg-white rounded-full hover:bg-gray-100 transition shadow-sm"
          >
            <Heart
              className={`w-5 h-5 ${
                isWatchlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>

          {/* Auction status badge */}
          <div className="absolute bottom-2 left-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              product.auction?.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {product.auction?.status === 'active' ? 'Đang diễn ra' : product.auction?.status || 'N/A'}
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-primary transition">
            {product.name}
          </h3>
          
          {/* Category */}
          <p className="text-xs text-muted-foreground mb-2">{product.category}</p>

          {/* Highest bidder (nếu có) */}
          {(product.currentHighestBidder || product.auction?.currentHighestBidder) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <User className="w-3 h-3" />
              <span>Nhà đấu giá cao nhất: <span className="font-medium text-foreground">{product.currentHighestBidder || product.auction?.currentHighestBidder}</span></span>
            </div>
          )}

          {/* Buy Now price (nếu có) */}
          {product.auction?.buyNowPrice && (
            <div className="mb-2 text-sm">
              <span className="text-xs text-muted-foreground">Giá mua ngay: </span>
              <span className="font-semibold text-primary">{formatPrice(product.auction.buyNowPrice)}</span>
            </div>
          )}

          {/* Ngày đăng sản phẩm */}
          {product.createdAt && (
            <p className="text-xs text-muted-foreground mb-2">Đăng: {new Date(product.createdAt).toLocaleDateString('vi-VN')}</p>
          )}

          {/* Seller info (nếu có) */}
          {product.sellerId && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <User className="w-3 h-3" />
              <span>Người bán: {product.sellerId.username || 'N/A'}</span>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium">{product.rating}</span>
          </div>

          {/* Price section */}
          <div className="mt-auto space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">Giá hiện tại</p>
                <p className="text-xl font-bold text-primary">{formatPrice(product.price)}</p>
              </div>
              {product.auction?.startPrice && product.auction.startPrice !== product.price && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Giá khởi điểm</p>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.auction.startPrice)}
                  </p>
                </div>
              )}
            </div>

            {/* Bids and Time */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{product.bids} lượt đấu giá</span>
              <span className={`font-semibold ${
                isEndingSoon() ? 'text-red-500' : 'text-orange-500'
              }`}>
                {product.timeLeft}
              </span>
            </div>

            {/* Bid step (nếu có) */}
            {product.auction?.bidStep && (
              <p className="text-xs text-muted-foreground">
                Bước giá: {formatPrice(product.auction.bidStep)}
              </p>
            )}
          </div>

          <button className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            Đấu giá ngay
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
