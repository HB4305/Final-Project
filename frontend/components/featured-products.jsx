import { useState, useEffect, useCallback } from 'react';
import { Heart, Clock, TrendingUp, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import productService from '../app/services/productService';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop';
const FETCH_CONFIG = { limit: 12, sortBy: 'newest', status: 'active', page: 1 };
const ENDING_SOON_HOURS = 24;
const HOT_BID_THRESHOLD = 10;

// Helper functions
const calculateTimeRemaining = (endAt) => {
  if (!endAt) return 'N/A';
  
  const diff = new Date(endAt) - new Date();
  if (diff < 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
};

const isEndingSoon = (endAt) => {
  if (!endAt) return false;
  const hoursRemaining = (new Date(endAt) - new Date()) / (1000 * 60 * 60);
  return hoursRemaining > 0 && hoursRemaining < ENDING_SOON_HOURS;
};

// Sub-components
const ProductBadges = ({ auction }) => (
  <div className="absolute top-2 left-2 flex gap-2">
    {isEndingSoon(auction?.endAt) && (
      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-sm flex items-center gap-1 shadow-sm">
        <Clock className="w-3 h-3" /> Ending Soon
      </span>
    )}
    {auction?.bidCount > HOT_BID_THRESHOLD && (
      <span className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-sm flex items-center gap-1 shadow-sm">
        <TrendingUp className="w-3 h-3" /> Hot
      </span>
    )}
  </div>
);

const WatchlistButton = ({ productId, isWatched, onToggle }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onToggle(productId);
    }}
    className="absolute top-2 right-2 p-2 bg-white rounded-full hover:bg-gray-100 transition shadow-sm"
    aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
  >
    <Heart className={`w-5 h-5 ${isWatched ? 'fill-primary text-primary' : 'text-gray-400'}`} />
  </button>
);

const ProductImage = ({ product }) => (
  <div className="relative h-48 bg-muted overflow-hidden group">
    <img
      src={product.primaryImageUrl || product.imageUrls?.[0] || FALLBACK_IMAGE}
      alt={product.title}
      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
    />
  </div>
);

const SellerRating = ({ seller }) => (
  <div className="flex items-center gap-1 mb-3">
    <span className="text-yellow-400">★</span>
    <span className="text-xs font-medium text-foreground">
      {seller?.ratingSummary?.averageRating?.toFixed(1) || '0.0'}
    </span>
    <span className="text-xs text-muted-foreground">
      ({seller?.ratingSummary?.totalRatings || 0})
    </span>
  </div>
);

const ProductPrice = ({ auction }) => (
  <div>
    <p className="text-xs text-muted-foreground">Current Bid</p>
    <p className="text-xl font-bold text-primary">
      ${(auction?.currentPrice || 0).toLocaleString()}
    </p>
    {auction?.startPrice && (
      <p className="text-xs text-muted-foreground line-through">
        ${auction.startPrice.toLocaleString()}
      </p>
    )}
  </div>
);

const ProductCard = ({ product, isWatched, onToggleWatchlist }) => (
  <Link key={product._id} to={`/product/${product._id}`}>
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col border border-border">
      <div className="relative">
        <ProductImage product={product} />
        <ProductBadges auction={product.auction} />
        <WatchlistButton 
          productId={product._id} 
          isWatched={isWatched} 
          onToggle={onToggleWatchlist} 
        />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1">
          {product.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {product.category?.name || 'Uncategorized'}
        </p>

        <SellerRating seller={product.seller} />

        <div className="space-y-2 mt-auto">
          <ProductPrice auction={product.auction} />

          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {product.auction?.bidCount || 0} bids
            </span>
            <span className="text-primary font-semibold">
              {calculateTimeRemaining(product.auction?.endAt)}
            </span>
          </div>

          <span className={`inline-block text-xs px-2 py-1 rounded ${
            product.auction?.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {product.auction?.status || 'N/A'}
          </span>
        </div>

        <button className="w-full mt-3 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition font-semibold text-sm">
          Place Bid
        </button>
      </div>
    </div>
  </Link>
);

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts(FETCH_CONFIG);
        if (response.success) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleWatchlist = useCallback((productId) => {
    setWatchlist(prev => {
      const updated = new Set(prev);
      updated.has(productId) ? updated.delete(productId) : updated.add(productId);
      return updated;
    });
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Trending Now</h2>
          <p className="text-sm text-muted-foreground">Hot items people are bidding on</p>
        </div>
        <Link 
          to="/products" 
          className="text-primary hover:text-primary/90 font-semibold text-sm flex items-center gap-1"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            isWatched={watchlist.has(product._id)}
            onToggleWatchlist={toggleWatchlist}
          />
        ))}
      </div>
    </section>
  );
}