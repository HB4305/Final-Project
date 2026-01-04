import React, { useState, useEffect } from "react";
import {
  Heart,
  Gavel,
  CheckCircle,
  Clock,
  TrendingUp,
  ShoppingBag,
  PackageCheck,
  XCircle,
  ArrowRight,
  Edit,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "../../components/navigation";
import watchlistService from "../services/watchlistService";
import auctionService from "../services/auctionService";
import transactionService from "../services/transactionService";
import ratingService from "../services/ratingService";
import { sellerDeleteProduct } from "../services/productService";
import RatingComponent from "../../components/rating-component";
import UpdateProductDescription from "../../components/update-product-description";
import { useAuth } from "../context/AuthContext";
import Toast from "../../components/Toast";

const dashboardTabs = [
  { key: "participating", label: "Đang tham gia", icon: Gavel, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "watchlist", label: "Đang theo dõi", icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" },
  { key: "won", label: "Đã thắng", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  { key: "selling", label: "Đang bán", icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-500/10" },
  { key: "sold", label: "Đã bán", icon: PackageCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, currentUser, loginWithToken, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("participating");
  const [toast, setToast] = useState(null);

  // Data states
  const [participatingAuctions, setParticipatingAuctions] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [sellingAuctions, setSellingAuctions] = useState([]);
  const [soldAuctions, setSoldAuctions] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    activeBids: 0,
    watchlistCount: 0,
    wonCount: 0,
    sellingCount: 0,
  });

  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTransactionForRating, setSelectedTransactionForRating] =
    useState(null);

  // Edit Product Description Modal State
  const [showEditDescModal, setShowEditDescModal] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);

  // Handle OAuth callback token
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      loginWithToken(token)
        .then(() => {
          searchParams.delete("token");
          setSearchParams(searchParams);
        })
        .catch((error) => {
          console.error("OAuth login failed:", error);
          navigate("/auth/login?error=oauth_failed");
        });
    } else if (!authLoading && !isLoggedIn) {
      navigate("/auth/login");
    }
  }, [searchParams, isLoggedIn, authLoading, navigate]);

  // Load all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [participatingData, watchlistData, wonData, sellingData, soldData] =
        await Promise.all([
          auctionService.getParticipatingAuctions({ page: 1, limit: 10 }),
          watchlistService.getWatchlist({ page: 1, limit: 10 }),
          auctionService.getWonAuctions({ page: 1, limit: 10 }),
          auctionService.getSellingAuctions({ page: 1, limit: 10 }),
          auctionService.getSoldAuctions({ page: 1, limit: 10 }),
        ]);

      setParticipatingAuctions(participatingData.data.auctions);
      setWatchlist(watchlistData.data.watchlist);
      setWonAuctions(wonData.data.auctions);
      setSellingAuctions(sellingData.data.auctions);
      setSoldAuctions(soldData.data.auctions);

      setStats({
        activeBids: participatingData.data.pagination.total,
        watchlistCount: watchlistData.data.pagination.total,
        wonCount: wonData.data.pagination.total,
        sellingCount: sellingData.data.pagination.total,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      // Don't show error immediately on UI to avoid flashing if it's just one failed request
      // but log it.
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (productId) => {
    try {
      await watchlistService.removeFromWatchlist(productId);
      fetchAllData();
      setToast({ message: "Đã xoá khỏi danh sách theo dõi", type: "success" });
    } catch (err) {
      setToast({
        message: "Không thể xoá khỏi danh sách theo dõi",
        type: "error",
      });
    }
  };

  const handleCancelTransaction = async (auctionId) => {
    if (
      !confirm(
        "Bạn có chắc muốn hủy giao dịch này? Người mua sẽ bị đánh giá -1 (Tiêu cực) với lý do: Người thắng không thanh toán."
      )
    ) {
      return;
    }

    try {
      await transactionService.cancelTransaction(
        auctionId,
        "Người thắng không thanh toán"
      );

      // Auto rate -1
      // Find the auction to get bidder ID
      const auction = soldAuctions.find(a => a._id === auctionId);
      if (auction && auction.currentHighestBidderId) {
        try {
          await ratingService.createRating(auction.currentHighestBidderId._id, {
            score: -1,
            comment: "Người thắng không thanh toán",
            orderId: auctionId, // Using auctionId as orderId for now
            context: "post_transaction"
          });
        } catch (ratingErr) {
          console.error("Auto rating failed:", ratingErr);
        }
      }

      setToast({ message: "Đã hủy giao dịch & đánh giá tiêu cực người mua", type: "success" });
      fetchAllData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Không thể hủy giao dịch",
        type: "error",
      });
    }
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa sản phẩm "${productTitle}"?\n\nTất cả người đặt giá sẽ nhận được email thông báo và cuộc đấu giá sẽ bị hủy.`
      )
    ) {
      return;
    }

    try {
      const result = await sellerDeleteProduct(productId);
      if (result.success) {
        setToast({ 
          message: result.message || "Xóa sản phẩm thành công", 
          type: "success" 
        });
        fetchAllData(); // Refresh the data
      } else {
        setToast({
          message: result.message || "Không thể xóa sản phẩm",
          type: "error",
        });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Lỗi khi xóa sản phẩm",
        type: "error",
      });
    }
  };

  const handleRateSeller = (auction) => {
    setSelectedTransactionForRating({
      auction,
      type: "rating_seller",
      targetUser: auction.sellerId
    });
    setShowRatingModal(true);
  };

  const handleRateWinner = (auction) => {
    setSelectedTransactionForRating({
      auction,
      type: "rating_buyer",
      targetUser: auction.currentHighestBidderId
    });
    setShowRatingModal(true);
  };

  // Removed handleSubmitRating as logic is moved to customSubmitAction inline or generic handler
  // But RatingComponent calls onSubmitRating as a callback. 
  // We can keep a simplified version or just empty for refresh.
  const handleRatingSuccess = () => {
    setToast({ message: "Đánh giá thành công!", type: "success" });
    setShowRatingModal(false);
    setSelectedTransactionForRating(null);
    fetchAllData();
  };



  const formatTimeLeft = (endAt) => {
    const now = new Date();
    const end = new Date(endAt);
    const diff = end - now;

    if (diff <= 0) return "Đã kết thúc";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} ngày`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-400 bg-clip-text text-transparent pb-2">
            Bảng Điều Khiển
          </h1>
          <p className="text-muted-foreground text-lg">
            Quản lý hoạt động đấu giá và tài khoản của bạn
          </p>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${currentUser?.roles?.includes('seller') || currentUser?.roles?.includes('admin') ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-12 animate-slide-up`}>
          {[
            { title: "Đang đấu giá", value: stats.activeBids, icon: Gavel, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200", gradient: "from-blue-50 to-white" },
            { title: "Đang theo dõi", value: stats.watchlistCount, icon: Heart, color: "text-pink-600", bg: "bg-pink-100", border: "border-pink-200", gradient: "from-pink-50 to-white" },
            { title: "Đã thắng", value: stats.wonCount, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", border: "border-green-200", gradient: "from-green-50 to-white" },
            { title: "Đang bán", value: stats.sellingCount, icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200", gradient: "from-orange-50 to-white", key: "selling" },
          ]
            .filter(item => {
              if (item.key === "selling") {
                return currentUser?.roles?.includes('seller') || currentUser?.roles?.includes('admin');
              }
              return true;
            })
            .map((item, index) => (
              <div key={index} className={`glass-card p-6 rounded-2xl border border-white/10 ${item.bg.replace('100', '500/10')} hover:scale-[1.02] transition-transform duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1 text-gray-400">{item.title}</p>
                    <p className={`text-4xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${item.bg.replace('100', '500/20')} ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Dashboard Content */}
        <div className="flex flex-col lg:flex-row gap-8 animate-slide-up" style={{ animationDelay: "100ms" }}>

          <div className="lg:w-64 flex-shrink-0">
            <div className="glass-card border border-white/10 bg-[#1e293b]/60 rounded-2xl p-4 sticky top-28 space-y-2">
              {dashboardTabs
                .filter((tab) => {
                  if (tab.key === "selling" || tab.key === "sold") {
                    return (
                      currentUser?.roles?.includes("seller") ||
                      currentUser?.roles?.includes("admin")
                    );
                  }
                  return true;
                })
                .map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${isActive
                        ? `bg-primary/20 text-primary shadow-sm border border-primary/20`
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? "text-primary" : "text-gray-400"
                          }`}
                      />
                      {tab.label}
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="glass-card border border-white/10 bg-[#1e293b]/60 rounded-2xl p-6 min-h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 text-red-500">
                  <AlertCircle className="w-10 h-10 mb-4" />
                  <p>{error}</p>
                  <button onClick={fetchAllData} className="mt-4 text-primary hover:underline">Thử lại</button>
                </div>
              ) : (
                <>
                  {/* --- Participating Auctions --- */}
                  {activeTab === "participating" && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-blue-500" />
                        Đấu giá đang tham gia
                      </h2>
                      {participatingAuctions.length === 0 ? (
                        <EmptyState message="Bạn chưa tham gia đấu giá nào." />
                      ) : (
                        participatingAuctions.map((auction) => (
                          <div key={auction._id} className="group relative glass-card bg-[#1e293b]/40 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all duration-300">
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="w-full sm:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                                <img
                                  src={auction.productId?.primaryImageUrl || "/placeholder.svg"}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  alt={auction.productId?.title}
                                  onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                      {auction.productId?.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                      {auction.productId?.description || "Không có mô tả"}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${auction.isWinning ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                      }`}>
                                      {auction.isWinning ? "Đang dẫn đầu" : "Bị vượt giá"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-end justify-between gap-4 mt-2">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Giá của bạn</p>
                                    <p className="text-lg font-bold text-primary">
                                      {auction.userHighestBid?.amount?.toLocaleString()} ₫
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Giá hiện tại</p>
                                    <p className="text-lg font-bold text-foreground">
                                      {auction.currentPrice?.toLocaleString()} ₫
                                    </p>
                                  </div>
                                  <div className="ml-auto">
                                    <Link to={`/product/${auction.productId?._id || auction.productId}`} className="btn-primary py-2 px-4 shadow-md text-sm">
                                      Đặt thêm giá
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* --- Watchlist --- */}
                  {activeTab === "watchlist" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        Sản phẩm đang theo dõi
                      </h2>
                      {watchlist.length === 0 ? (
                        <EmptyState message="Danh sách theo dõi trống." />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {watchlist.map((item) => {
                            if (!item.productId) {
                                return (
                                    <div key={item._id} className="glass-card bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-400">Sản phẩm không tồn tại</h3>
                                            <p className="text-sm text-muted-foreground">Sản phẩm này đã bị xóa khỏi hệ thống.</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRemoveFromWatchlist(item.productId?._id || item._id); // Handle removal even if product is gone
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition"
                                            title="Bỏ theo dõi"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                )
                            }
                            return (
                            <div key={item._id} className="glass-card bg-[#1e293b]/40 border border-white/10 rounded-xl overflow-hidden hover:bg-white/5 transition-all duration-300 group">
                              <div className="relative h-48 overflow-hidden">
                                <img
                                  src={item.productId?.primaryImageUrl || "/placeholder.svg"}
                                  alt={item.productId?.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveFromWatchlist(item.productId?._id);
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 transition-colors"
                                  title="Bỏ theo dõi"
                                >
                                  <Heart className="w-5 h-5 fill-current" />
                                </button>
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4">
                                  <h3 className="text-white font-bold truncate">{item.productId?.title}</h3>
                                </div>
                              </div>
                              <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                  <span className="text-sm text-muted-foreground">Ngày thêm: {new Date(item.watchedAt).toLocaleDateString('vi-VN')}</span>
                                  <span className="text-primary font-bold">
                                    {item.productId?.startingPrice?.toLocaleString()} ₫
                                  </span>
                                </div>
                                <Link to={`/product/${item.productId?._id}`} className="block w-full text-center py-2 bg-white/5 hover:bg-primary hover:text-white rounded-lg transition-colors font-medium border border-white/10 hover:border-primary text-gray-300">
                                  Xem chi tiết
                                </Link>
                              </div>
                            </div>
                          )})}
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- Won Auctions --- */}
                  {activeTab === "won" && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Đấu giá đã thắng
                      </h2>
                      {wonAuctions.length === 0 ? (
                        <EmptyState message="Bạn chưa thắng phiên đấu giá nào." />
                      ) : (
                        wonAuctions.map((auction) => (
                          <div key={auction._id} className="glass-card bg-[#1e293b]/40 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                            <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center">
                              <img
                                src={auction.productId?.primaryImageUrl || "/placeholder.svg"}
                                alt={auction.productId?.title}
                                className="w-20 h-20 rounded-lg object-cover ring-2 ring-green-500/20"
                                onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
                              />
                              <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-bold text-lg mb-1 text-gray-200">{auction.productId?.title}</h3>
                                <p className="text-green-400 font-bold mb-1">Giá thắng: {auction.currentPrice?.toLocaleString()} ₫</p>
                                <p className="text-xs text-gray-400">
                                  Người bán: <Link to={`/profile/ratings/${auction.sellerId?._id}`} className="text-primary hover:underline">{auction.sellerId?.username}</Link>
                                </p>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[140px]">
                                {!auction.isRated && (
                                  <button
                                    onClick={() => handleRateSeller(auction)}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition shadow-sm mb-1"
                                  >
                                    ⭐ Đánh giá ngay
                                  </button>
                                )}
                                <Link
                                  to={`/product/${auction.productId?._id || auction.productId}`}
                                  className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/10 transition text-center"
                                >
                                  Xem chi tiết
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* --- Selling Auctions --- */}
                  {activeTab === "selling" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-orange-500" />
                          Sản phẩm đang bán
                        </h2>
                        <Link to="/products/create" className="btn-primary py-2 px-4 shadow-lg shadow-primary/20 flex items-center gap-2 text-sm">
                          <span className="text-lg leading-none">+</span> Đăng bán mới
                        </Link>
                      </div>

                      {sellingAuctions.length === 0 ? (
                        <EmptyState message="Bạn chưa đăng bán sản phẩm nào." />
                      ) : (
                        sellingAuctions.map((auction) => (
                          <div key={auction._id} className="glass-card bg-[#1e293b]/40 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all duration-300">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                              <img
                                src={auction.productId?.primaryImageUrl || "/placeholder.svg"}
                                alt={auction.productId?.title}
                                className="w-20 h-20 rounded-lg object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
                              />
                              <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-bold text-lg mb-1 text-gray-200">{auction.productId?.title}</h3>
                                <div className="flex justify-center sm:justify-start gap-4 text-sm text-gray-400">
                                  <span className="flex items-center gap-1"><Gavel className="w-3 h-3" /> {auction.bidCount} lượt đặt</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimeLeft(auction.endAt)}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <p className="text-lg font-bold text-primary mb-1">{auction.currentPrice?.toLocaleString()} ₫</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedProductForEdit({
                                        id: auction.productId?._id,
                                        description:
                                          auction.productId?.descriptionHistory?.[
                                            auction.productId.descriptionHistory.length - 1
                                          ]?.text || "",
                                        metadata: auction.productId?.metadata || {},
                                      });
                                      setShowEditDescModal(true);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Sửa nội dung"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  <Link to={`/product/${auction.productId?._id}`} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Xem chi tiết">
                                    <ArrowRight className="w-5 h-5" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                            {/* Progress Bar for Time */}
                            <div className="mt-4 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                style={{ width: '60%' }} // Note: This should be dynamic based on time
                              ></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* --- Sold Auctions --- */}
                  {activeTab === "sold" && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <PackageCheck className="w-5 h-5 text-indigo-500" />
                        Đã bán thành công
                      </h2>
                      {soldAuctions.length === 0 ? (
                        <EmptyState message="Chưa có sản phẩm nào được bán." />
                      ) : (
                        soldAuctions.map((auction) => (
                          <div key={auction._id} className="glass-card bg-[#1e293b]/40 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all duration-300">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                              <img
                                src={auction.productId?.primaryImageUrl || "/placeholder.svg"}
                                alt={auction.productId?.title}
                                className="w-20 h-20 rounded-lg object-cover grayscale"
                              />
                              <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-bold text-lg mb-1 text-gray-200">{auction.productId?.title}</h3>
                                <p className="text-indigo-400 font-bold">Giá bán: {auction.currentPrice?.toLocaleString()} ₫</p>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Hoàn tất</span>
                                  <span className="text-xs text-muted-foreground">Người mua: {auction.currentHighestBidderId?.username}</span>
                                </div>
                              </div>
                              <div>
                                {auction.transactionStatus === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handleCancelTransaction(auction._id)}
                                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition mr-2"
                                      title="Hủy và đánh giá -1"
                                    >
                                      Hủy đơn
                                    </button>
                                    {!auction.isRated && (
                                      <button
                                        onClick={() => handleRateWinner(auction)}
                                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition shadow-sm"
                                      >
                                        Đánh giá
                                      </button>
                                    )}
                                  </>
                                )}
                                {auction.transactionStatus !== "pending" && !auction.isRated && (
                                  <button
                                    onClick={() => handleRateWinner(auction)}
                                    className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition shadow-sm mr-2"
                                  >
                                    Đánh giá
                                  </button>
                                )}
                                <Link
                                  to={`/product/${auction.productId?._id || auction.productId}`}
                                  className="ml-2 px-3 py-2 bg-white/5 text-gray-300 hover:bg-white/10 rounded-lg text-sm font-medium transition"
                                >
                                  Chi tiết
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedTransactionForRating && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl animate-slide-up">
            <button
              onClick={() => setShowRatingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2 hover:bg-white/10 rounded-full transition"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="p-6">
              {/* Title replaced by component's internal header */}
              <RatingComponent
                targetUser={{
                  id: selectedTransactionForRating.targetUser?._id,
                  name:
                    selectedTransactionForRating.targetUser?.username ||
                    selectedTransactionForRating.targetUser?.fullName || "User",
                  rating:
                    selectedTransactionForRating.targetUser?.ratingSummary
                      ?.score || 0,
                  totalRatings:
                    selectedTransactionForRating.targetUser?.ratingSummary
                      ?.totalCount || 0,
                }}
                transactionId={selectedTransactionForRating.auction?.orderId || selectedTransactionForRating.auction?._id}
                userType={selectedTransactionForRating.type === "rating_seller" ? "buyer" : "seller"}
                onSubmitRating={handleRatingSuccess}
                customSubmitAction={async ({ score, comment }) => {
                  await ratingService.createRating(selectedTransactionForRating.targetUser._id, {
                    score,
                    comment,
                    orderId: selectedTransactionForRating.auction?.orderId,
                    context: "post_transaction"
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Description Modal */}
      {showEditDescModal && selectedProductForEdit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl animate-slide-up">
            <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Cập nhật nội dung sản phẩm</h3>
              <button
                onClick={() => {
                  setShowEditDescModal(false);
                  setSelectedProductForEdit(null);
                }}
                className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <UpdateProductDescription
                productId={selectedProductForEdit.id}
                currentDescription={selectedProductForEdit.description}
                currentMetadata={selectedProductForEdit.metadata}
                onUpdate={async (updatedProduct) => {
                  await fetchAllData();
                  setShowEditDescModal(false);
                  setSelectedProductForEdit(null);
                  setToast({
                    type: "success",
                    message: "Cập nhật mô tả sản phẩm thành công!",
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <PackageCheck className="w-10 h-10 text-gray-300" />
      </div>
      <p className="text-lg text-muted-foreground font-medium">{message}</p>
    </div>
  )
}
