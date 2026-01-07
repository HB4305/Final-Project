import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';
import { useCountdown } from './hooks';
import { formatPrice, isNewProduct } from './utils';
import { FALLBACK_IMAGE } from './constants';

export default function RelatedProductCard({ product }) {
  const navigate = useNavigate();
  const time = useCountdown(product.auction?.endAt);

  const imageUrl = product.primaryImageUrl || FALLBACK_IMAGE;

  const handleClick = () => {
    navigate(`/product/${product._id}`);
    window.scrollTo(0, 0);
  };

  return (
    <div 
      onClick={handleClick}
      className="glass-card rounded-xl overflow-hidden hover:bg-white/5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group h-full border border-white/10"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img 
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-contain p-2 bg-white group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = FALLBACK_IMAGE;
          }}
        />
        
        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {isNewProduct(product.createdAt) && (
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg animate-pulse">
              <Sparkles className="w-3 h-3" /> Mới đăng
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          {time.isEnded ? (
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
              Đã kết thúc
            </span>
          ) : time.days >= 0 && (time.days * 24 + time.hours) < 168 && (
            <span className="px-2 py-1 bg-orange-600 text-white text-xs font-semibold rounded animate-pulse">
              🔥 Sắp kết thúc
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h4 className="font-bold text-gray-100 text-sm line-clamp-2 group-hover:text-primary transition min-h-[2.5rem]">
          {product.title}
        </h4>

        {/* Price */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Giá hiện tại</p>
          <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {formatPrice(product.auction?.currentPrice)}
          </p>
        </div>

        {/* Time & Bids */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${time.isEnded ? 'text-red-500' : 'text-orange-400'}`} />
            <span className={time.isEnded ? 'text-red-500 font-medium' : 'text-orange-400 font-medium'}>
              {time.isEnded 
                ? 'Đã kết thúc'
                : `${time.days} ngày ${time.hours} giờ`
              }
            </span>
          </div>
          <span>{product.auction?.bidCount || 0} lượt</span>
        </div>
      </div>
    </div>
  );
}
