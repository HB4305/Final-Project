import { useState, useEffect, useCallback } from 'react';
import { Heart, Share2, Shield, Clock, MessageSquare, Loader, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import productService from '../../services/productService.js';

const formatPrice = (price) => {
  if (!price) return 'N/A';
  return `${price.toLocaleString('vi-VN')} VNĐ`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop";

// Lightbox Component for Full-Size Image View
const ImageLightbox = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>
      <img 
        src={imageUrl || FALLBACK_IMAGE}
        alt="Full size view"
        className="max-w-full max-h-full object-contain cursor-default"
        onClick={(e) => e.stopPropagation()}
        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
      />
    </div>
  );
};

const ImageGallery = ({ images, primaryImage, mainImageIndex, onImageChange, onImageClick }) => (
  <div>
    <div 
      className="bg-muted rounded-lg overflow-hidden mb-4 aspect-square cursor-pointer hover:opacity-90 transition"
      onClick={() => onImageClick(primaryImage || images?.[mainImageIndex] || FALLBACK_IMAGE)}
    >
      <img 
        src={primaryImage || images?.[mainImageIndex] || FALLBACK_IMAGE} 
        alt="Product"
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
      />
    </div>
    <div className="flex gap-2 overflow-x-auto">
      {images && images.length > 0 ? (
        images.map((img, idx) => (
          <button 
            key={idx}
            onClick={() => {
              onImageChange(idx);
              onImageClick(img || FALLBACK_IMAGE);
            }}
            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition hover:opacity-75 ${
              mainImageIndex === idx ? 'border-primary' : 'border-border'
            }`}
          >
            <img 
              src={img || FALLBACK_IMAGE} 
              alt={`View ${idx + 1}`} 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            />
          </button>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No additional images</p>
      )}
    </div>
  </div>
);

const SellerInfo = ({ seller }) => (
  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-6">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="font-semibold">{seller?.username || 'Unknown Seller'}</p>
        <Shield className="w-4 h-4 text-green-500" />
      </div>
      <p className="text-sm text-muted-foreground">
        {seller?.ratingSummary?.averageRating?.toFixed(1) || '0.0'} ★ ({seller?.ratingSummary?.totalRatings || 0} reviews)
      </p>
    </div>
    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition">
      Contact Seller
    </button>
  </div>
);

const BidSection = ({ auction, showForm, onToggleForm, bidAmount, onBidChange, onSubmit }) => (
  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
    <p className="text-sm text-muted-foreground mb-2">Current Bid</p>
    <p className="text-4xl font-bold text-primary mb-4">{formatPrice(auction?.currentPrice)}</p>
    
    <div className="flex gap-4 text-sm mb-6">
      <div>
        <p className="text-muted-foreground">{auction?.bidCount || 0} Bids</p>
      </div>
      <div className="flex items-center gap-1 text-red-500 font-semibold">
        <Clock className="w-4 h-4" /> {formatDateTime(auction?.endAt)}
      </div>
    </div>

    {!showForm ? (
      <div className="space-y-2">
        <button 
          onClick={() => onToggleForm(true)}
          className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
        >
          Place Bid
        </button>
        <button className="w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition font-semibold">
          Buy Now - {formatPrice(auction?.buyNowPrice || auction?.currentPrice)}
        </button>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-3">
        <input 
          type="number"
          value={bidAmount}
          onChange={(e) => onBidChange(e.target.value)}
          placeholder={`Minimum: ${formatPrice((auction?.currentPrice || 0) + (auction?.priceStep || 50000))}`}
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
            onClick={() => onToggleForm(false)}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
          >
            Cancel
          </button>
        </div>
      </form>
    )}
  </div>
);

const ActionButtons = ({ isWatchlisted, onToggleWatchlist }) => (
  <div className="flex gap-3">
    <button 
      onClick={onToggleWatchlist}
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
);

const DescriptionSection = ({ description }) => (
  <div className="bg-background border border-border rounded-lg p-6 mb-8">
    <h2 className="text-2xl font-bold mb-4">Description</h2>
    <p className="text-muted-foreground leading-relaxed">
      {description || 'No description available'}
    </p>
  </div>
);

const BidHistorySection = ({ bidHistory }) => (
  <div className="bg-background border border-border rounded-lg p-6 mb-8">
    <h2 className="text-2xl font-bold mb-4">Bid History</h2>
    <div className="space-y-3">
      {bidHistory && bidHistory.length > 0 ? (
        bidHistory.map((bid, idx) => (
          <div key={idx} className="flex justify-between items-center pb-3 border-b border-border last:border-b-0">
            <div>
              <p className="font-medium">{bid.bidder}</p>
              <p className="text-xs text-muted-foreground">{bid.time}</p>
            </div>
            <p className="font-bold text-primary">{formatPrice(bid.amount)}</p>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-center py-4">No bids yet</p>
      )}
    </div>
  </div>
);

const QuestionSection = () => (
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
);

const SpecificationsSidebar = ({ specs, relatedProducts }) => (
  <div>
    <div className="bg-background border border-border rounded-lg p-6 sticky top-24">
      <h3 className="font-bold text-lg mb-4">Specifications</h3>
      <div className="space-y-3">
        {specs ? (
          Object.entries(specs).map(([key, value], idx) => (
            <div key={idx} className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground capitalize">{key}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No specifications available</p>
        )}
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-bold mb-4">Related Items</h3>
          <div className="space-y-2">
            {relatedProducts.map((related) => (
              <Link 
                key={related._id}
                to={`/product/${related._id}`}
                className="block p-2 hover:bg-muted rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <img 
                    src={related.primaryImageUrl || FALLBACK_IMAGE}
                    alt={related.title}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{related.title}</p>
                    <p className="text-xs text-primary font-bold">{formatPrice(related.auction?.currentPrice)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default function ProductDetailPage() {
  const { id } = useParams();
  const [mainImage, setMainImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getProductById(id);
        
        if (response.success) {
          setProduct(response.data);
        } else {
          setError(response.error || 'Failed to load product');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handlePlaceBid = useCallback(async (e) => {
    e.preventDefault();
    const currentPrice = product?.auction?.currentPrice || 0;
    
    if (bidAmount > currentPrice) {
      try {
        const response = await productService.placeBid(id, { amount: bidAmount });
        if (response.success) {
          alert(`Bid of ${formatPrice(bidAmount)} placed successfully!`);
          setBidAmount('');
          setShowBidForm(false);
          
          const updatedProduct = await productService.getProductById(id);
          if (updatedProduct.success) {
            setProduct(updatedProduct.data);
          }
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to place bid');
      }
    } else {
      alert(`Bid must be higher than current price: ${formatPrice(currentPrice)}`);
    }
  }, [bidAmount, id, product?.auction?.currentPrice]);

  const toggleWatchlist = useCallback(() => {
    setIsWatchlisted(prev => !prev);
  }, []);

  const openLightbox = useCallback((imageUrl) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Product not found'}</p>
          <Link to="/" className="text-primary hover:underline">
            ← Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ImageLightbox 
        isOpen={lightboxOpen}
        imageUrl={lightboxImage}
        onClose={closeLightbox}
      />
      
      <nav className="sticky top-0 bg-background border-b border-border z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="text-primary hover:underline font-medium">
            ← Back to Auctions
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <ImageGallery
            images={product.imageUrls}
            primaryImage={product.primaryImageUrl}
            mainImageIndex={mainImage}
            onImageChange={setMainImage}
            onImageClick={openLightbox}
          />

          <div className="flex flex-col">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                {product.categoryId?.name || 'Uncategorized'}
              </p>
              <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
              
              <SellerInfo seller={product.sellerId} />
            </div>

            <BidSection
              auction={product.auction}
              showForm={showBidForm}
              onToggleForm={setShowBidForm}
              bidAmount={bidAmount}
              onBidChange={setBidAmount}
              onSubmit={handlePlaceBid}
            />

            <ActionButtons 
              isWatchlisted={isWatchlisted}
              onToggleWatchlist={toggleWatchlist}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DescriptionSection description={product.descriptionHistory?.[0]?.text} />
            <BidHistorySection bidHistory={product.bidHistory} />
            <QuestionSection />
          </div>

          <SpecificationsSidebar 
            specs={product.metadata?.specs}
            relatedProducts={product.relatedProducts}
          />
        </div>
      </main>
    </div>
  );
}