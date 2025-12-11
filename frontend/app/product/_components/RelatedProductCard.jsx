import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useCountdown } from './hooks';
import { formatPrice } from './utils';
import { FALLBACK_IMAGE } from './constants';

export default function RelatedProductCard({ product }) {
  const navigate = useNavigate();
  const time = useCountdown(product.auction?.endAt);

  const imageUrl = product.primaryImageUrl || FALLBACK_IMAGE.PRODUCT;

  const handleClick = () => {
    navigate(`/product/${product._id}`);
    window.scrollTo(0, 0);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img 
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = FALLBACK_IMAGE.PRODUCT;
          }}
        />
        
        {/* Status Badge */}
        {time.isEnded ? (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
            Đã kết thúc
          </div>
        ) : time.days === 0 && time.hours < 24 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-orange-600 text-white text-xs font-semibold rounded animate-pulse">
            🔥 Sắp kết thúc
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition">
          {product.title}
        </h4>

        {/* Price */}
        <div>
          <p className="text-xs text-muted-foreground">Giá hiện tại</p>
          <p className="text-primary font-bold">
            {formatPrice(product.auction?.currentPrice)}
          </p>
        </div>

        {/* Time & Bids */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {time.isEnded 
                ? 'Đã kết thúc'
                : `${time.days}d ${time.hours}h`
              }
            </span>
          </div>
          <span>{product.auction?.bidCount || 0} lượt đấu giá</span>
        </div>
      </div>
    </div>
  );
}
