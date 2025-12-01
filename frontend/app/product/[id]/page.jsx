import React, { useState } from 'react';
import { Heart, Share2, Shield, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const mockProductDetails = {
  1: {
    id: 1,
    name: 'Vintage Rolex Submariner Watch',
    category: 'Collectibles',
    currentBid: 2450,
    bids: 24,
    timeLeft: '2h 15m',
    startingPrice: 1500,
    buyNowPrice: 3500,
    description: 'Rare vintage Rolex Submariner from 1987 in excellent condition. Original box and papers included. Recently serviced by professional watchmaker.',
    seller: {
      name: 'John Collector',
      rating: 4.8,
      reviews: 245,
      verified: true
    },
    images: [
      '/vintage-rolex-watch-1.jpg',
      '/vintage-rolex-watch-2.jpg',
      '/vintage-rolex-watch-3.jpg'
    ],
    specs: [
      { label: 'Year', value: '1987' },
      { label: 'Condition', value: 'Excellent' },
      { label: 'Movement', value: 'Automatic' },
      { label: 'Water Resistant', value: '300m' }
    ],
    bidHistory: [
      { bidder: 'User****234', amount: 2450, time: '5 minutes ago' },
      { bidder: 'User****567', amount: 2350, time: '15 minutes ago' },
      { bidder: 'User****890', amount: 2200, time: '1 hour ago' }
    ],
    relatedProducts: [
      { id: 2, name: 'Vintage Omega Seamaster', price: 1800 },
      { id: 3, name: 'Seiko Automatic Watch', price: 450 },
      { id: 4, name: 'Tissot PRX Watch', price: 800 }
    ]
  }
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const [mainImage, setMainImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  const product = mockProductDetails[id] || mockProductDetails[1];

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (bidAmount > product.currentBid) {
      alert(`Bid of $${bidAmount} placed successfully!`);
      setBidAmount('');
      setShowBidForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 bg-background border-b border-border z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="text-primary hover:underline font-medium">
            ← Back to Auctions
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Product Images */}
          <div>
            <div className="bg-muted rounded-lg overflow-hidden mb-4 aspect-square">
              <img 
                src={product.images[mainImage] || "/placeholder.svg"} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setMainImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                    mainImage === idx ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img src={img || "/placeholder.svg"} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              
              {/* Seller Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{product.seller.name}</p>
                    {product.seller.verified && <Shield className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.seller.rating} ★ ({product.seller.reviews} reviews)
                  </p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition">
                  Contact Seller
                </button>
              </div>
            </div>

            {/* Bid Section */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Current Bid</p>
              <p className="text-4xl font-bold text-primary mb-4">${product.currentBid.toLocaleString()}</p>
              <div className="flex gap-4 text-sm mb-6">
                <div>
                  <p className="text-muted-foreground">{product.bids} Bids</p>
                </div>
                <div className="flex items-center gap-1 text-red-500 font-semibold">
                  <Clock className="w-4 h-4" /> {product.timeLeft} left
                </div>
              </div>

              {!showBidForm ? (
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowBidForm(true)}
                    className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
                  >
                    Place Bid
                  </button>
                  <button className="w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition font-semibold">
                    Buy Now - ${product.buyNowPrice.toLocaleString()}
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePlaceBid} className="space-y-3">
                  <input 
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Minimum: $${(product.currentBid + 50).toLocaleString()}`}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
                    >
                      Confirm Bid
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowBidForm(false)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setIsWatchlisted(!isWatchlisted)}
                className={`flex-1 px-4 py-3 border rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
                  isWatchlisted 
                    ? 'bg-red-500/10 border-red-500 text-red-500' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWatchlisted ? 'fill-current' : ''}`} />
                {isWatchlisted ? 'Saved' : 'Save'}
              </button>
              <button className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted transition font-semibold flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Description and Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-background border border-border rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Bid History</h2>
              <div className="space-y-3">
                {product.bidHistory.map((bid, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-3 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium">{bid.bidder}</p>
                      <p className="text-xs text-muted-foreground">{bid.time}</p>
                    </div>
                    <p className="font-bold text-primary">${bid.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" /> Ask a Question
              </h2>
              <form className="space-y-3">
                <textarea 
                  placeholder="Ask the seller a question about this item..."
                  rows="4"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium">
                  Send Question
                </button>
              </form>
            </div>
          </div>

          {/* Specs Sidebar */}
          <div>
            <div className="bg-background border border-border rounded-lg p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Specifications</h3>
              <div className="space-y-3">
                {product.specs.map((spec, idx) => (
                  <div key={idx} className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">{spec.label}</span>
                    <span className="font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-bold mb-4">Related Items</h3>
                <div className="space-y-2">
                  {product.relatedProducts.map((related) => (
                    <Link 
                      key={related.id}
                      to={`/product/${related.id}`}
                      className="block p-2 hover:bg-muted rounded-lg transition"
                    >
                      <p className="text-sm font-medium line-clamp-1">{related.name}</p>
                      <p className="text-sm text-primary font-bold">${related.price.toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
