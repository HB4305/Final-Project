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
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "../../components/navigation";
import watchlistService from "../services/watchlistService";
import auctionService from "../services/auctionService";
import transactionService from "../services/transactionService";
import ratingService from "../services/ratingService";
import RatingComponent from "../../components/rating-component";
import UpdateProductDescription from "../../components/update-product-description";
import { useAuth } from "../context/AuthContext";
import Toast from "../../components/Toast";

const dashboardTabs = [
  { key: "participating", label: "Đang tham gia", icon: Gavel },
  { key: "watchlist", label: "Danh sách theo dõi", icon: Heart },
  { key: "won", label: "Đã thắng", icon: CheckCircle },
  { key: "selling", label: "Đang bán", icon: ShoppingBag },
  { key: "sold", label: "Đã bán", icon: PackageCheck },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, currentUser, loginWithToken } = useAuth();
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
      // Login with token from OAuth
      loginWithToken(token)
        .then(() => {
          // Remove token from URL
          searchParams.delete("token");
          setSearchParams(searchParams);
        })
        .catch((error) => {
          console.error("OAuth login failed:", error);
          navigate("/auth/login?error=oauth_failed");
        });
    }
  }, [searchParams]);

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
      setError(
        err.response?.data?.message || "Không thể tải dữ liệu dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (productId) => {
    try {
      await watchlistService.removeFromWatchlist(productId);
      fetchAllData(); // Reload all data
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
        "Bạn có chắc muốn hủy giao dịch này? Người mua sẽ bị đánh giá -1."
      )
    ) {
      return;
    }

    try {
      await transactionService.cancelTransaction(
        auctionId,
        "Người thắng không thanh toán"
      );
      setToast({ message: "Đã hủy giao dịch thành công", type: "success" });
      fetchAllData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Không thể hủy giao dịch",
        type: "error",
      });
    }
  };

  const handleRateSeller = (auction) => {
    setSelectedTransactionForRating(auction);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (ratingData) => {
    try {
      await ratingService.createRating(ratingData.targetUserId, {
        score: ratingData.rating, // Pass 1 or -1 directly (backend expects number)
        comment: ratingData.comment,
        orderId: ratingData.transactionId, // This is now correctly the Order ID
        context: "post_transaction",
      });

      setToast({ message: "Đánh giá thành công!", type: "success" });
      setShowRatingModal(false);
      setSelectedTransactionForRating(null);
      fetchAllData(); // Refresh data to show updated status if needed
    } catch (err) {
      console.error(err);
      setToast({
        message: err.response?.data?.message || "Lỗi khi gửi đánh giá",
        type: "error",
      });
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Bảng điều khiển
            </h1>
            <p className="text-muted-foreground text-lg">
              Quản lý đấu giá, đặt giá và danh sách theo dõi
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium mb-2">
                    Đang đấu giá
                  </p>
                  <p className="text-4xl font-bold text-blue-700">
                    {stats.activeBids}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Gavel className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-600 text-sm font-medium mb-2">
                    Đang theo dõi
                  </p>
                  <p className="text-4xl font-bold text-pink-700">
                    {stats.watchlistCount}
                  </p>
                </div>
                <div className="bg-pink-100 p-3 rounded-lg">
                  <Heart className="w-8 h-8 text-pink-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium mb-2">
                    Đã thắng
                  </p>
                  <p className="text-4xl font-bold text-green-700">
                    {stats.wonCount}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium mb-2">
                    Đang bán
                  </p>
                  <p className="text-4xl font-bold text-orange-700">
                    {stats.sellingCount}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <ShoppingBag className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-border mb-8 overflow-x-auto pb-4">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition ${activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="bg-background border border-border rounded-lg p-6">
            {loading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={fetchAllData}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Đang Tham Gia */}
                {activeTab === "participating" && (
                  <div className="space-y-4">
                    {participatingAuctions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Bạn chưa tham gia đấu giá nào
                      </p>
                    ) : (
                      participatingAuctions.map((auction) => (
                        <Link
                          key={auction._id}
                          to={`/product/${auction.productId?._id}`}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                auction.productId?.primaryImageUrl ||
                                "/placeholder.svg"
                              }
                              alt={auction.productId?.title}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="font-semibold mb-1">
                                {auction.productId?.title}
                              </h3>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>
                                  Giá hiện tại:{" "}
                                  {auction.currentPrice?.toLocaleString()} VNĐ
                                </span>
                                <span className="text-primary font-semibold">
                                  Giá của bạn:{" "}
                                  {auction.userHighestBid?.amount?.toLocaleString()}{" "}
                                  VNĐ
                                </span>
                                {auction.isWinning && (
                                  <span className="text-green-600 font-semibold">
                                    🏆 Đang dẫn đầu
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-500 font-semibold">
                              {formatTimeLeft(auction.endAt)}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}

                {/* Yêu Thích */}
                {activeTab === "watchlist" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {watchlist.length === 0 ? (
                      <p className="col-span-2 text-center text-muted-foreground py-8">
                        Danh sách yêu thích trống
                      </p>
                    ) : (
                      watchlist.map((item) => (
                        <div
                          key={item._id}
                          className="p-4 border border-border rounded-lg"
                        >
                          <Link to={`/product/${item.productId?._id}`}>
                            <img
                              src={
                                item.productId?.primaryImageUrl ||
                                "/placeholder.svg"
                              }
                              alt={item.productId?.title}
                              className="w-full h-40 object-cover rounded-lg mb-3"
                            />
                            <h3 className="font-semibold mb-2">
                              {item.productId?.title}
                            </h3>
                          </Link>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {new Date(item.watchedAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                            <button
                              onClick={() =>
                                handleRemoveFromWatchlist(item.productId?._id)
                              }
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Đã Thắng */}
                {activeTab === "won" && (
                  <div className="space-y-4">
                    {wonAuctions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Bạn chưa thắng auction nào
                      </p>
                    ) : (
                      wonAuctions.map((auction) => (
                        <div
                          key={auction._id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                auction.productId?.primaryImageUrl ||
                                "/placeholder.svg"
                              }
                              alt={auction.productId?.title}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="font-semibold mb-1">
                                {auction.productId?.title}
                              </h3>
                              <div className="flex gap-4 text-sm">
                                <span className="text-green-600 font-semibold">
                                  Giá thắng:{" "}
                                  {auction.currentPrice?.toLocaleString()} VNĐ
                                </span>
                                <span className="text-muted-foreground">
                                  Trạng thái: {auction.transactionStatus}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Người bán:{" "}
                                <Link
                                  to={`/profile/ratings/${auction.sellerId?._id}`}
                                  className="text-primary hover:underline"
                                >
                                  {auction.sellerId?.username}
                                </Link>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!auction.isRated && (
                              <button
                                onClick={() => handleRateSeller(auction)}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                              >
                                Đánh giá người bán
                              </button>
                            )}
                            <Link
                              to={`/product/${auction.productId?._id || auction.productId
                                }`}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                            >
                              Xem Chi Tiết
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Đang Bán */}
                {activeTab === "selling" && (
                  <div>
                    <Link
                      to="/products/create"
                      className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium mb-4"
                    >
                      + Đăng Sản Phẩm Mới
                    </Link>
                    <div className="space-y-4 mt-4">
                      {sellingAuctions.length === 0 ? (
                        <p className="text-muted-foreground">
                          Bạn chưa đăng sản phẩm nào
                        </p>
                      ) : (
                        sellingAuctions.map((auction) => (
                          <div
                            key={auction._id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
                          >
                            <Link 
                              to={`/product/${auction.productId?._id}`}
                              className="flex items-center gap-4 flex-1"
                            >
                              <img
                                src={
                                  auction.productId?.primaryImageUrl ||
                                  "/placeholder.svg"
                                }
                                alt={auction.productId?.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="font-semibold mb-1 hover:text-primary transition">
                                  {auction.productId?.title}
                                </h3>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                  <span>
                                    Giá hiện tại:{" "}
                                    {auction.currentPrice?.toLocaleString()} VNĐ
                                  </span>
                                  <span>Lượt đặt: {auction.bidCount}</span>
                                </div>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4">
                                <p className="text-sm text-blue-500 font-semibold">
                                  {formatTimeLeft(auction.endAt)}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedProductForEdit({
                                    id: auction.productId?._id,
                                    description: auction.productId?.descriptionHistory?.[auction.productId.descriptionHistory.length - 1]?.text || '',
                                    metadata: auction.productId?.metadata || {}
                                  });
                                  setShowEditDescModal(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                                title="Sửa mô tả sản phẩm"
                              >
                                Sửa Mô Tả
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Đã Bán */}
                {activeTab === "sold" && (
                  <div className="space-y-4">
                    {soldAuctions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Chưa có sản phẩm nào đã bán
                      </p>
                    ) : (
                      soldAuctions.map((auction) => (
                        <div
                          key={auction._id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                auction.productId?.primaryImageUrl ||
                                "/placeholder.svg"
                              }
                              alt={auction.productId?.title}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="font-semibold mb-1">
                                {auction.productId?.title}
                              </h3>
                              <div className="flex gap-4 text-sm">
                                <span className="text-green-600 font-semibold">
                                  Giá bán:{" "}
                                  {auction.currentPrice?.toLocaleString()} VNĐ
                                </span>
                                <span className="text-muted-foreground">
                                  Trạng thái: {auction.transactionStatus}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Người mua:{" "}
                                {auction.currentHighestBidderId?.username}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {auction.transactionStatus === "pending" && (
                              <button
                                onClick={() =>
                                  handleCancelTransaction(auction._id)
                                }
                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                              >
                                Hủy Giao Dịch
                              </button>
                            )}
                            <Link
                              to={`/product/${auction.productId?._id || auction.productId
                                }`}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                            >
                              Chi Tiết
                            </Link>
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
      {/* Rating Modal */}
      {showRatingModal && selectedTransactionForRating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl w-full max-w-lg overflow-hidden relative">
            <button
              onClick={() => setShowRatingModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="p-6">
              <RatingComponent
                targetUser={{
                  id: selectedTransactionForRating.sellerId._id,
                  name:
                    selectedTransactionForRating.sellerId.username ||
                    selectedTransactionForRating.sellerId.fullName,
                  rating:
                    selectedTransactionForRating.sellerId.ratingSummary
                      ?.score || 0,
                  totalRatings:
                    selectedTransactionForRating.sellerId.ratingSummary
                      ?.totalCount || 0,
                }}
                transactionId={selectedTransactionForRating.orderId}
                userType="buyer"
                onSubmitRating={handleSubmitRating}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Description Modal */}
      {showEditDescModal && selectedProductForEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowEditDescModal(false);
                setSelectedProductForEdit(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 bg-white rounded-full p-2"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="p-6">
              <UpdateProductDescription
                productId={selectedProductForEdit.id}
                currentDescription={selectedProductForEdit.description}
                currentMetadata={selectedProductForEdit.metadata}
                onUpdate={async (updatedProduct) => {
                  // Refresh selling auctions after update
                  await fetchAllData();
                  setShowEditDescModal(false);
                  setSelectedProductForEdit(null);
                  setToast({
                    type: 'success',
                    message: 'Cập nhật mô tả sản phẩm thành công!'
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
