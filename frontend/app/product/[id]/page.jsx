import { useState, useRef, useEffect } from 'react';
import { Heart, Share2, Shield, MessageSquare, Loader, AlertCircle, TrendingUp, Eye } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Navigation from '../../../components/navigation';
import productService from '../../services/productService.js';
import ProductQA from '../../../components/product-qa.jsx';
import { orderService } from '../../services/orderService.js';
import OrderCompletion from '../../../components/order-completion';
import ChatComponent from '../../../components/chat-component';
import { useAuth } from '../../context/AuthContext'

// Import all components from _components folder
import {
  useProductDetail,
  TABS,
  ImageGallery,
  ImageLightbox,
  AuctionSection,
  SellerInfoCard,
  RelatedProductsSection,
  DescriptionTab,
  DetailsTab,
  BiddersTab,
  formatPrice
} from '../_components';

function getStepFromStatus(status) {
  const stepMap = {
    'awaiting_payment': 1,
    'seller_confirmed_payment': 2,
    'shipped': 2,
    'completed': 4,
    'cancelled': 0
  };
  return stepMap[status] || 1;
}

/**
 * =============================================
 * MAIN PRODUCT DETAIL PAGE COMPONENT
 * =============================================
 */
export default function ProductDetailPage() {
  const { id } = useParams();
  const { currentUser: user } = useAuth();
  const { product, loading, error, refetch } = useProductDetail(id);
  
  // State management
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const qaRef = useRef(null);
  
  // Order states
  const [order, setOrder] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'buyer' or 'seller'
  const [ratings, setRatings] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  /**
   * Fetch order data when product auction ends
   */
  const fetchOrderData = async () => {
    if (!product?.auction || !user) return;
    
    // Only fetch order if auction has ended
    if (product.auction.status === 'ended') {
      try {
        setOrderLoading(true);
        
        // Try to get existing order
        const orderResponse = await orderService.getOrderByAuctionId(product.auction._id);
        setOrder(orderResponse.data.order);
        setUserRole(orderResponse.data.userRole);
        setRatings(orderResponse.data.ratings);
        
      } catch (err) {
        console.log('No order found, checking if should create...', err);
        
        // If no order exists and user is the winner, try to create one
        if (product.auction.currentHighestBidderId && user._id === product.auction.currentHighestBidderId.toString()) {
          try {
            const createResponse = await orderService.createOrderFromAuction(product.auction._id);
            setOrder(createResponse.data.order);
            setUserRole('buyer');
            setRatings(null);
          } catch (createErr) {
            console.error('Failed to create order:', createErr);
            setOrder(null);
            setUserRole(null);
            setRatings(null);
          }
        } else {
          setOrder(null);
          setUserRole(null);
          setRatings(null);
        }
      } finally {
        setOrderLoading(false);
      }
    }
  };

  // Fetch order when product loads or changes
  useEffect(() => {
    fetchOrderData();
  }, [product, user]);

  const handleUpdateOrder = async () => {
    // Refresh both product and order data after order update
    await refetch();
    await fetchOrderData();
  };

  // ... (rest of code)


  // Check if user is participant (buyer or seller)
  const isParticipant = user && product?.auction && (
    (product.auction.currentHighestBidderId && user._id.toString() === product.auction.currentHighestBidderId.toString()) ||
    (product.sellerId?._id && user._id.toString() === product.sellerId._id.toString())
  );


  /**
   * Handlers
   */
  const handlePlaceBid = async (amount) => {
    try {
      const response = await productService.placeBid(id, { amount });
      if (response.success) {
        alert(`Đặt giá ${formatPrice(amount)} thành công!`);
        refetch();
      } else {
        alert(response.error || 'Đặt giá thất bại');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Đã có lỗi xảy ra');
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép link sản phẩm!');
    }
  };

  const toggleWatchlist = async () => {
    try {
      // TODO: Implement watchlist API call
      setIsWatchlisted(!isWatchlisted);
      alert(isWatchlisted ? 'Đã xóa khỏi danh sách theo dõi' : 'Đã thêm vào danh sách theo dõi');
    } catch (err) {
      alert('Không thể cập nhật danh sách theo dõi');
    }
  };

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải sản phẩm...</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link 
              to="/products" 
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              ← Quay lại danh sách sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * No Product State
   */
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Không có dữ liệu sản phẩm</p>
        </div>
      </div>
    );
  }

  // Prepare images for gallery and lightbox
  const allImages = [product.primaryImageUrl, ...(product.imageUrls || [])].filter(Boolean);

  /**
   * Main Render
   */
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox 
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary transition">Sản phẩm</Link>
          <span>/</span>
          <Link 
            to={`/category/${product.categoryId?._id}`}
            className="hover:text-primary transition"
          >
            {product.categoryId?.name || 'Danh mục'}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{product.title}</span>
        </nav>

        {/* Product Header */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{product.views || 0} lượt xem</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{product.auction?.bidCount || 0} lượt đặt giá</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleWatchlist}
                className={`p-3 rounded-lg border transition ${
                  isWatchlisted 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : 'border-border hover:bg-muted'
                }`}
                title={isWatchlisted ? 'Bỏ theo dõi' : 'Theo dõi sản phẩm'}
              >
                <Heart className={`w-5 h-5 ${isWatchlisted ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleShare}
                className="p-3 border border-border rounded-lg hover:bg-muted transition"
                title="Chia sẻ"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                className="p-3 border border-border rounded-lg hover:bg-muted transition"
                title="Báo cáo"
              >
                <Shield className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Images + Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white border border-border rounded-xl p-6">
              <ImageGallery 
                images={product.imageUrls}
                primaryImage={product.primaryImageUrl}
                onImageClick={openLightbox}
              />
            </div>

            {/* Tabs Section */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-border">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 font-semibold transition border-b-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'description' && (
                  <DescriptionTab 
                    description={product.description}
                    descriptionHistory={product.descriptionHistory}
                    bidHistory={product.auction?.bidHistory}
                  />
                )}
                {activeTab === 'details' && (
                  <DetailsTab product={product} />
                )}
                {activeTab === 'bidders' && (
                  <BiddersTab bidders={product.auction?.topBidders} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Auction + Seller */}
          <div className="space-y-6">
            {/* Auction Section */}
            <AuctionSection 
              auction={product.auction}
              onPlaceBid={handlePlaceBid}
            />

            {/* Seller Info Card */}
            <SellerInfoCard seller={product.sellerId} />
            
            {/* Quick Actions */}
            <div className="bg-white border border-border rounded-xl p-6 space-y-3">
              <button 
                onClick={() => qaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Hỏi người bán
              </button>
              <button className="w-full py-3 border border-border rounded-lg hover:bg-muted transition font-medium flex items-center justify-center gap-2">
                <Eye className="w-5 h-5" />
                Theo dõi sản phẩm
              </button>
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div ref={qaRef} className="mb-8">
          <ProductQA 
            productId={id}
            sellerId={product.sellerId?._id}
          />
        </div>

        {/* Order Completion Flow - Show when auction ended and user is participant */}
        {product.auction?.status === 'ended' && isParticipant && (
          <div className="mb-8">
            {orderLoading ? (
              <div className="bg-white border border-border rounded-xl p-8">
                <div className="flex items-center justify-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mr-3" />
                  <p className="text-muted-foreground">Đang tải thông tin đơn hàng...</p>
                </div>
              </div>
            ) : order ? (
              <>
                  {/* Order Completion Component */}
                <div className="bg-white border border-border rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-6">Quy trình hoàn tất đơn hàng</h2>
                  <OrderCompletion
                    order={order}
                    userRole={userRole}
                    ratings={ratings}
                    onUpdateOrder={handleUpdateOrder}
                  />
                </div>

                {/* Chat Section */}
                <div className="bg-white border border-border rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chat với {userRole === 'buyer' ? 'Người bán' : 'Người mua'}
                  </h3>
                  <ChatComponent
                    order={order}
                    currentUser={user}
                  />
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <p className="text-yellow-800">
                  Đơn hàng chưa được tạo. Vui lòng liên hệ admin nếu bạn là người chiến thắng.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auction ended - not participant */}
        {product.auction?.status === 'ended' && !isParticipant && (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-8 text-center mb-8">
            <p className="text-gray-700 text-lg">Phiên đấu giá đã kết thúc</p>
            <p className="text-gray-500 mt-2">Sản phẩm này đã có người mua</p>
          </div>
        )}

        {/* Related Products Section */}
        <RelatedProductsSection products={product.relatedProducts} />
      </main>
    </div>
  );
}