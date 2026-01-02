import { Heart, Clock, TrendingUp, User, ShoppingBag } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, FALLBACK_IMAGE } from './utils';

const ProductCard = ({ product, isWatchlisted, onToggleWatchlist }) => {
  const [imgSrc, setImgSrc] = React.useState(product.image || FALLBACK_IMAGE);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
     setImgSrc(product.image || FALLBACK_IMAGE);
     setImgError(false);
  }, [product.image]);

  const isEndingSoon = () => {
    if (!product.auction?.endAt) return false;
    const hoursRemaining = (new Date(product.auction.endAt) - new Date()) / (1000 * 60 * 60);
    return hoursRemaining > 0 && hoursRemaining < 24;
  };

  const isHot = product.bids > 10;

  return (
    <Link to={`/product/${product.id}`} className="group h-full">
      <div className="glass-card rounded-2xl overflow-hidden hover:bg-white/5 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col border border-white/10">
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gray-800/50 overflow-hidden flex items-center justify-center">
          {!imgError ? (
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
              onError={() => {
                 if (imgSrc !== FALLBACK_IMAGE) {
                     setImgSrc(FALLBACK_IMAGE);
                 } else {
                     setImgError(true);
                 }
              }}
            />
          ) : (
             <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                 <ShoppingBag className="w-12 h-12 opacity-20" />
                 <span className="text-xs font-medium opacity-40">No Image</span>
             </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {isEndingSoon() && (
              <span className="px-2.5 py-1 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                <Clock className="w-3 h-3" /> Sắp kết thúc
              </span>
            )}
            {isHot && (
              <span className="px-2.5 py-1 bg-orange-500/90 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                <TrendingUp className="w-3 h-3" /> Hot
              </span>
            )}
             <span className={`px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-lg ${
              product.auction?.status === 'active' 
                ? 'bg-green-500/90 text-white' 
                : 'bg-gray-600/90 text-white'
            }`}>
              {product.auction?.status === 'active' ? 'Đang diễn ra' : product.auction?.status || 'N/A'}
            </span>
          </div>

          {/* Watchlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWatchlist(product.id);
            }}
            className="absolute top-3 right-3 p-2.5 bg-black/40 border border-white/10 backdrop-blur rounded-full hover:bg-black/60 transition shadow-lg group/btn"
          >
            <Heart
              className={`w-4 h-4 transition ${
                isWatchlisted ? 'fill-red-500 text-red-500' : 'text-gray-200 group-hover/btn:text-red-500'
              }`}
            />
          </button>
        </div>

        {/* Info Section */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category */}
          <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/10 text-blue-200 border border-white/10">
                {product.category}
             </span>
             <div className="flex items-center gap-1">
                <span className="text-yellow-400 fill-current text-xs">★</span>
                <span className="text-xs font-bold text-gray-300">{product.rating}</span>
             </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-100 mb-2 line-clamp-2 group-hover:text-primary transition text-base min-h-[3rem]">
            {product.name}
          </h3>
          
          {/* Seller info */}
           {product.sellerId && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
              <div className="p-1 bg-white/10 rounded-full">
                <User className="w-3 h-3" />
              </div>
              <span className="truncate max-w-[150px]">{product.sellerId.username || 'Người bán'}</span>
            </div>
           )}

          {/* Price section */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Giá hiện tại</p>
                <p className="text-lg font-bold text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    {formatPrice(product.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium mb-0.5">Thời gian còn lại</p>
                <span className={`text-sm font-bold flex items-center gap-1 justify-end ${
                    isEndingSoon() ? 'text-red-500' : 'text-orange-400'
                }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {product.timeLeft}
                </span>
              </div>
            </div>

             <div className="flex items-center gap-2">
                 <button className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                     <ShoppingBag className="w-4 h-4" /> Đấu giá
                 </button>
             </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
