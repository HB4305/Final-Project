import { useState, useRef, useEffect } from "react";
import {
  Heart,
  Share2,
  Shield,
  MessageSquare,
  Loader,
  AlertCircle,
  TrendingUp,
  Eye,
  ChevronRight,
  Home,
  FileText,
  List,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navigation from "../../../components/navigation";
import productService from "../../services/productService.js";
import watchlistService from "../../services/watchlistService.js";
import ProductQA from "../../../components/product-qa.jsx";
import { orderService } from "../../services/orderService.js";
import OrderCompletion from "../../../components/order-completion";
import ChatComponent from "../../../components/chat-component";
import Toast from "../../../components/Toast";
import { useAuth } from "../../context/AuthContext";

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
  formatPrice,
} from "../_components";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { currentUser: user } = useAuth();
  const { product, loading, error, refetch } = useProductDetail(id);

  // State management
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [toast, setToast] = useState(null);
  const qaRef = useRef(null);

  // Order states
  const [order, setOrder] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  // Fetch order logic...
  const fetchOrderData = async () => {
    if (!product?.auction || !user) return;
    if (product.auction.status === "ended") {
      try {
        setOrderLoading(true);
        const orderResponse = await orderService.getOrderByAuctionId(
          product.auction._id
        );
        setOrder(orderResponse.data.order);
        setUserRole(orderResponse.data.userRole);
        setRatings(orderResponse.data.ratings);
      } catch (err) {
        console.log("No order found, checking if should create...", err);
        if (
          product.auction.currentHighestBidderId &&
          user._id === product.auction.currentHighestBidderId.toString()
        ) {
          try {
            const createResponse = await orderService.createOrderFromAuction(
              product.auction._id
            );
            setOrder(createResponse.data.order);
            setUserRole("buyer");
            setRatings(null);
          } catch (createErr) {
            console.error("Failed to create order:", createErr);
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

  useEffect(() => {
    fetchOrderData();
  }, [product, user]);

  const handleUpdateOrder = async () => {
    await refetch();
    await fetchOrderData();
  };

  const isParticipant =
    user &&
    product?.auction &&
    ((product.auction.currentHighestBidderId &&
      user._id.toString() ===
      product.auction.currentHighestBidderId.toString()) ||
      (product.sellerId?._id &&
        user._id.toString() === product.sellerId._id.toString()));

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!id) return;
      try {
        const response = await watchlistService.checkWatchlist(id);
        setIsWatchlisted(response.data.isWatched || false);
      } catch (err) {
        console.error("Error checking watchlist status:", err);
      }
    };
    checkWatchlistStatus();
  }, [id]);

  const handlePlaceBid = async (amount) => {
    try {
      const response = await productService.placeBid(id, { amount });
      if (response.status === "success") {
        setToast({
          type: "success",
          message: `Đã thiết lập giá tối đa ${formatPrice(
            amount
          )} thành công! Hệ thống sẽ tự động đấu giá cho bạn.`,
        });
        refetch();
      } else {
        setToast({
          type: "error",
          message: response.message || "Đặt giá thất bại",
        });
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Đã có lỗi xảy ra",
      });
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
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast({
        type: "success",
        message: "Đã sao chép link sản phẩm!",
      });
    }
  };

  const toggleWatchlist = async () => {
    try {
      if (isWatchlisted) {
        await watchlistService.removeFromWatchlist(id);
        setIsWatchlisted(false);
        setToast({
          type: "success",
          message: "Đã xóa khỏi danh sách theo dõi",
        });
      } else {
        await watchlistService.addToWatchlist(id);
        setIsWatchlisted(true);
        setToast({
          type: "success",
          message: "Đã thêm vào danh sách theo dõi",
        });
      }
    } catch (err) {
      console.error("Watchlist error:", err);
      setToast({
        type: "error",
        message:
          err.response?.data?.message ||
          "Không thể cập nhật danh sách theo dõi",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center animate-pulse">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Đang tải sản phẩm...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-2xl border border-red-100">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-red-900">Không tìm thấy sản phẩm</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-muted-foreground text-lg">Không có dữ liệu sản phẩm</p>
        </div>
      </div>
    );
  }

  const allImages = [
    product.primaryImageUrl,
    ...(product.imageUrls || []),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <main className="container mx-auto px-4 py-8 pt-24 max-w-7xl animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          <Link to="/" className="hover:text-white transition flex items-center gap-1">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <Link to="/products" className="hover:text-blue-400 transition font-medium">
            Sản phẩm
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <Link
            to={`/products?category=${encodeURIComponent(product.categoryId?.name)}`}
            className="hover:text-blue-400 transition font-medium"
          >
            {product.categoryId?.name || "Danh mục"}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <span className="text-blue-400 font-bold truncate">
            {product.title}
          </span>
        </nav>

        {/* Product Header Card */}
        <div className="glass-card rounded-2xl p-6 mb-8 border border-white/20 shadow-2xl bg-[#1e293b]/60 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-white leading-tight">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{product.views || 0} lượt xem</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{product.auction?.bidCount || 0} lượt đặt giá</span>
                </div>
                {product.condition && (
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <span className="text-gray-500">Tình trạng:</span>
                    <span className="font-bold text-gray-200">{product.condition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 self-start">
              <button
                onClick={toggleWatchlist}
                className={`p-3 rounded-xl border transition-all duration-300 ${isWatchlisted
                    ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-md transform scale-105"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-md text-gray-400 hover:text-white"
                  }`}
                title={isWatchlisted ? "Bỏ theo dõi" : "Theo dõi sản phẩm"}
              >
                <Heart
                  className={`w-5 h-5 ${isWatchlisted ? "fill-current" : ""}`}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:text-blue-400 hover:shadow-md transition-all text-gray-400"
                title="Chia sẻ"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                className="p-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:text-red-400 hover:shadow-md transition-all text-gray-400"
                title="Báo cáo"
              >
                <Shield className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column: Images + Tabs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="glass-card bg-[#1e293b]/60 rounded-2xl p-4 shadow-xl border border-white/20 backdrop-blur-xl">
              <ImageGallery
                images={product.imageUrls}
                primaryImage={product.primaryImageUrl}
                onImageClick={openLightbox}
              />
            </div>

            {/* Tabs Section */}
            <div className="glass-card bg-[#1e293b]/60 rounded-2xl overflow-hidden shadow-xl border border-white/20 backdrop-blur-xl">
              {/* Tab Headers */}
              <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[120px] py-4 px-6 font-bold text-sm transition-all border-b-2 relative flex items-center justify-center gap-2 ${activeTab === tab.id
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
                      }`}
                  >
                    {tab.id === 'description' && <FileText className="w-4 h-4" />}
                    {tab.id === 'details' && <List className="w-4 h-4" />}
                    {tab.id === 'bidders' && <Trophy className="w-4 h-4" />}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 md:p-8 min-h-[300px]">
                {activeTab === "description" && (
                  <DescriptionTab
                    description={product.description}
                    descriptionHistory={product.descriptionHistory}
                    bidHistory={product.auction?.bidHistory}
                  />
                )}
                {activeTab === "details" && <DetailsTab product={product} />}
                {activeTab === "bidders" && (
                  <BiddersTab
                    bidders={product.auction?.topBidders}
                    productId={id}
                    isSeller={user && product.sellerId?._id === user._id}
                    onReject={async () => {
                      await refetch();
                      setToast({
                        type: "success",
                        message: "Đã từ chối bidder thành công!",
                      });
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Auction + Seller */}
          <div className="space-y-6">
            {/* Auction Section */}
            <div className="sticky top-24 space-y-6">
              <AuctionSection
                auction={product.auction}
                onPlaceBid={handlePlaceBid}
              />

              {/* Seller Info Card */}
              <SellerInfoCard seller={product.sellerId} />

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-3">
                <button
                  onClick={() =>
                    qaRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                  className="w-full py-3.5 bg-transparent border border-primary text-primary rounded-xl hover:bg-primary/10 transition font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-5 h-5" />
                  Hỏi người bán
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div ref={qaRef} className="mb-12 scroll-mt-24">
          <div className="glass-card bg-[#1e293b]/60 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <MessageSquare className="w-6 h-6 text-primary" />
              Hỏi đáp về sản phẩm
            </h2>
            <ProductQA productId={id} sellerId={product.sellerId?._id} />
          </div>
        </div>

        {/* Order Completion Flow - Show when auction ended and user is participant */}
        {product.auction?.status === "ended" && isParticipant && (
          <div className="mb-12 animate-slide-up">
            {orderLoading ? (
              <div className="glass-card bg-white p-8 text-center rounded-2xl">
                <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-gray-500">Đang tải thông tin đơn hàng...</p>
              </div>
            ) : order ? (
              <div className="space-y-8">
                {/* Order Completion Component */}
                <div className="glass-card bg-white rounded-2xl p-6 md:p-8 border border-green-100 shadow-lg shadow-green-900/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Quy trình hoàn tất đơn hàng
                    </h2>
                  </div>
                  <OrderCompletion
                    order={order}
                    userRole={userRole}
                    ratings={ratings}
                    onUpdateOrder={handleUpdateOrder}
                  />
                </div>

                {/* Chat Section */}
                <div className="glass-card bg-white rounded-2xl p-6 md:p-8 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Chat với {userRole === "buyer" ? "Người bán" : "Người mua"}
                  </h3>
                  <ChatComponent order={order} currentUser={user} />
                </div>
              </div>
            ) : (
              null
              // Handled in fetch logic or just hidden if failed
            )}
          </div>
        )}

        {/* Auction ended - not participant */}
        {product.auction?.status === "ended" && !isParticipant && (
          <div className="glass-card bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-white text-xl font-bold">Phiên đấu giá đã kết thúc</p>
            <p className="text-gray-400 mt-2">Sản phẩm này đã có người chiến thắng.</p>
            <Link to="/products" className="inline-block mt-6 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition">
              Xem sản phẩm khác
            </Link>
          </div>
        )}

        {/* Related Products Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 px-2 border-l-4 border-primary text-white">Sản phẩm tương tự</h2>
          <RelatedProductsSection products={product.relatedProducts} />
        </div>
      </main>
    </div>
  );
}
