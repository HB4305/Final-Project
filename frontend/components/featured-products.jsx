import React, { useState } from 'react';
import { Heart, Clock, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockProducts = [
  {
    id: 1,
    name: 'Vintage Rolex Watch',
    category: 'Collectibles',
    currentBid: 2450,
    bids: 24,
    timeLeft: '2h 15m',
    image: '/vintage-rolex-watch.jpg',
    rating: 4.8,
    reviews: 128,
    status: 'ending-soon',
    discount: 25
  },
  {
    id: 2,
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    currentBid: 1200,
    bids: 18,
    timeLeft: '5h 30m',
    image: '/macbook-pro-laptop.jpg',
    rating: 4.9,
    reviews: 256,
    status: 'popular',
    discount: 15
  },
  {
    id: 3,
    name: 'Designer Handbag',
    category: 'Fashion',
    currentBid: 450,
    bids: 12,
    timeLeft: '1h 45m',
    image: '/designer-handbag-luxury.jpg',
    rating: 4.7,
    reviews: 94,
    status: 'ending-soon',
    discount: 40
  },
  {
    id: 4,
    name: 'Gaming PC Setup',
    category: 'Electronics',
    currentBid: 1850,
    bids: 31,
    timeLeft: '8h 20m',
    image: '/gaming-pc-setup-rgb.jpg',
    rating: 4.9,
    reviews: 312,
    status: 'popular',
    discount: 20
  },
  {
    id: 5,
    name: 'Vintage Camera',
    category: 'Collectibles',
    currentBid: 320,
    bids: 8,
    timeLeft: '3h 10m',
    image: '/vintage-film-camera.jpg',
    rating: 4.6,
    reviews: 67,
    status: 'ending-soon',
    discount: 35
  },
  {
    id: 6,
    name: 'Antique Desk Lamp',
    category: 'Home & Garden',
    currentBid: 180,
    bids: 5,
    timeLeft: '12h 30m',
    image: '/antique-brass-desk-lamp.jpg',
    rating: 4.5,
    reviews: 43,
    status: 'normal',
    discount: 10
  }
];

export default function FeaturedProducts() {
  const [watchlist, setWatchlist] = useState(new Set());

  const toggleWatchlist = (productId) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(productId)) {
      newWatchlist.delete(productId);
    } else {
      newWatchlist.add(productId);
    }
    setWatchlist(newWatchlist);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Trending Now</h2>
          <p className="text-sm text-muted-foreground">Hot items people are bidding on</p>
        </div>
        <Link to="/products" className="text-primary hover:text-primary/90 font-semibold text-sm flex items-center gap-1">
          View All →
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProducts.map((product) => (
          <Link key={product.id} to={`/product/${product.id}`}>
            <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col border border-border">
              {/* Image Container */}
              <div className="relative h-48 bg-muted overflow-hidden group">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Status Badge */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {product.status === 'ending-soon' && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-sm flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3" /> Ending Soon
                    </span>
                  )}
                  {product.status === 'popular' && (
                    <span className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-sm flex items-center gap-1 shadow-sm">
                      <TrendingUp className="w-3 h-3" /> Hot
                    </span>
                  )}
                  {product.discount > 0 && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-sm shadow-sm">
                      {product.discount}% OFF
                    </span>
                  )}
                </div>

                {/* Watchlist Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleWatchlist(product.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full hover:bg-gray-100 transition shadow-sm"
                >
                  <Heart
                    className={`w-5 h-5 ${watchlist.has(product.id) ? 'fill-primary text-primary' : 'text-gray-400'}`}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.category}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-yellow-400">★</span>
                  <span className="text-xs font-medium text-foreground">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>

                <div className="space-y-2 mt-auto">
                  {/* Price */}
                  <div>
                    <p className="text-xs text-muted-foreground">Current Bid</p>
                    <p className="text-xl font-bold text-primary">${product.currentBid.toLocaleString()}</p>
                  </div>

                  {/* Bid Info */}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{product.bids} bids</span>
                    <span className="text-primary font-semibold">{product.timeLeft}</span>
                  </div>
                </div>

                <button className="w-full mt-3 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition font-semibold text-sm">
                  Place Bid
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
