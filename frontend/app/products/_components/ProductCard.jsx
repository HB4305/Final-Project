import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, FALLBACK_IMAGE } from './utils';

const ProductCard = ({ product, isWatchlisted, onToggleWatchlist }) => {
  return (
    <Link to={`/product/${product.id}`}>
      <div className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-40 bg-muted overflow-hidden">
          <img
            src={product.image || FALLBACK_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleWatchlist(product.id);
            }}
            className="absolute top-2 right-2 p-2 bg-white rounded-full hover:bg-gray-100 transition"
          >
            <Heart
              className={`w-5 h-5 ${
                isWatchlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
        </div>

        {/* Info Section */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">{product.category}</p>

          <div className="flex items-center gap-1 mb-3">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium">{product.rating}</span>
          </div>

          <div className="mt-auto space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Current Bid</p>
              <p className="text-xl font-bold text-primary">{formatPrice(product.price)}</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{product.bids} bids</span>
              <span className="text-red-500 font-semibold">{product.timeLeft}</span>
            </div>
          </div>

          <button className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            Bid Now
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
