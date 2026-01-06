import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  StarHalf,
  ArrowLeft,
  Loader,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ShoppingBag,
  User,
  Calendar,
} from "lucide-react";
import Navigation from "../../../components/navigation";
import ratingService from "../../services/ratingService";
import { useAuth } from "../../context/AuthContext";

export default function RatingsPage() {
  const { userId: paramUserId } = useParams();
  const { currentUser } = useAuth();
  // Resolve 'me' to actual ID, or use param ID, or fallback to current user
  const userId =
    paramUserId === "me" || !paramUserId
      ? currentUser?.id || currentUser?._id
      : paramUserId;

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userInfo, setUserInfo] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [activeTab, setActiveTab] = useState("received"); // 'received' or 'given'
  const [subFilter, setSubFilter] = useState("all"); // 'all', 'buyer_to_seller', 'seller_to_buyer'

  // Update fetchRatings when activeTab or subFilter changes
  useEffect(() => {
    if (userId) {
      fetchRatings();
    } else if (!loading) {
      setError("User not found");
    }
  }, [userId, pagination.page, activeTab, subFilter]); // Added dependencies

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError("");

      const contextFilter = subFilter === "all" ? null : subFilter;

      const [statsRes, ratingsRes] = await Promise.all([
        ratingService.getUserRatingStats(userId),
        ratingService.getUserRatings(
          userId,
          pagination.page,
          pagination.limit,
          activeTab, // 'received' or 'given'
          contextFilter
        ),
      ]);

      if (statsRes.data?.status === "success") {
        const data = statsRes.data.data;
        // Handle potential structure mismatch (data.user vs flat data)
        setUserInfo(data.user || data);
      }

      if (ratingsRes.data) {
        // Try to find the ratings array in common locations
        // 1. data.data.ratings (Standard valid response)
        // 2. data.ratings (If interceptor unwraps data OR backend omits status wrapper)
        // 3. data.data (If returns array directly)
        // 4. data (If interceptor returns array directly)

        const rawBody = ratingsRes.data;
        let foundRatings = [];
        let foundPagination = {};

        // Helper to extract pagination
        const getPagination = (source) => ({
          page: source.page || 1,
          totalPages: source.pages || 1,
          total: source.total || 0,
        });

        if (Array.isArray(rawBody?.data?.ratings)) {
          foundRatings = rawBody.data.ratings;
          foundPagination = getPagination(rawBody.data);
        } else if (Array.isArray(rawBody?.ratings)) {
          foundRatings = rawBody.ratings;
          foundPagination = getPagination(rawBody);
        } else if (Array.isArray(rawBody?.data)) {
          foundRatings = rawBody.data;
        } else if (Array.isArray(rawBody)) {
          foundRatings = rawBody;
        }

        console.log("Ratings Fetch Debug:", {
          found: foundRatings.length,
          structure: Object.keys(rawBody || {}),
        });

        setRatings(foundRatings);
        if (foundPagination.total) {
          setPagination((prev) => ({ ...prev, ...foundPagination, limit: 10 }));
        }
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
      setError("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSubFilter("all");
    setPagination({ ...pagination, page: 1 });
  };

  const handleSubFilterChange = (filter) => {
    setSubFilter(filter);
    setPagination({ ...pagination, page: 1 });
  };

  // REMOVED early return if (loading && !ratings.length) ...

  // Helper to determine sub-filter labels based on active tab
  const getSubFilterLabel = (key) => {
    if (activeTab === "received") {
      if (key === "buyer_to_seller") return "Từ người mua";
      if (key === "seller_to_buyer") return "Từ người bán";
    } else {
      if (key === "buyer_to_seller") return "Cho người bán"; // I am buyer -> rating seller
      if (key === "seller_to_buyer") return "Cho người mua"; // I am seller -> rating buyer
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {loading && !userInfo && !ratings.length ? (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center animate-pulse">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              Đang tải đánh giá...
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-24 pb-12 max-w-5xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại
          </button>

          {/* Header Stats */}
          <div className="glass-card rounded-2xl p-6 md:p-8 mb-8 border border-white/20 bg-[#1e293b]/60 shadow-2xl animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Đánh giá & Nhận xét
                </h1>
                <p className="text-muted-foreground">
                  Lịch sử đánh giá của{" "}
                  {userInfo?.fullName || userInfo?.username}
                </p>
              </div>

              <div className="flex items-center gap-6 md:gap-12">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <span className="text-3xl font-bold text-white">
                {userInfo?.ratingSummary?.totalCount
                  ? ((userInfo.ratingSummary.score || 0) <= 1 ? (userInfo.ratingSummary.score || 0) * 100 : (userInfo.ratingSummary.score || 0)).toFixed(0)
                  : 0}
                %
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Độ uy tín</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white mb-1">
                    {userInfo?.ratingSummary?.totalCount || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Lượt đánh giá</p>
                </div>
                <div className="text-center hidden sm:block">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="flex items-center text-green-600 font-bold">
                      <ThumbsUp className="w-4 h-4 mr-1" />{" "}
                      {userInfo?.ratingSummary?.countPositive || 0}
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center text-red-600 font-bold">
                      <ThumbsDown className="w-4 h-4 mr-1" />{" "}
                      {userInfo?.ratingSummary?.countNegative || 0}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tỷ lệ hài lòng
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Tabs (Received vs Given) */}
          <div className="flex gap-4 mb-4 border-b border-white/10 pb-4">
            <button
              onClick={() => handleTabChange("received")}
              className={`text-lg font-bold pb-1 transition-all ${
                activeTab === "received"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Đã nhận
            </button>
            <button
              onClick={() => handleTabChange("given")}
              className={`text-lg font-bold pb-1 transition-all ${
                activeTab === "given"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Đã gửi
            </button>
          </div>

          {/* Sub Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => handleSubFilterChange("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                subFilter === "all"
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-transparent text-gray-400 hover:bg-white/5"
              }`}
            >
              Tất cả
            </button>

            <button
              onClick={() => handleSubFilterChange("buyer_to_seller")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                subFilter === "buyer_to_seller"
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-transparent text-gray-400 hover:bg-white/5"
              }`}
            >
              {getSubFilterLabel("buyer_to_seller")}
            </button>

            <button
              onClick={() => handleSubFilterChange("seller_to_buyer")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                subFilter === "seller_to_buyer"
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-transparent text-gray-400 hover:bg-white/5"
              }`}
            >
              {getSubFilterLabel("seller_to_buyer")}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
              <div className="p-1 bg-red-100 rounded-full">
                <ThumbsDown className="w-4 h-4" />
              </div>
              {error}
            </div>
          )}

          {/* Ratings List */}
          <div className="space-y-4">
            {ratings.length > 0 ? (
              ratings.map((rating, index) => {
                const displayedUser =
                  activeTab === "given" ? rating.rateeId : rating.raterId;
                const actionText =
                  activeTab === "given"
                    ? "Đã gửi đánh giá cho"
                    : "Đánh giá bởi";
                const isPositive = rating.score === 1;

                return (
                  <div
                    key={rating._id}
                    className="glass-card border border-white/20 bg-[#1e293b]/60 rounded-2xl p-6 hover:shadow-xl transition duration-300 flex flex-col md:flex-row gap-6 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* User Info */}
                    <div className="flex items-start gap-4 min-w-[200px]">
                      <img
                        src={
                          displayedUser?.profileImageUrl || "/placeholder.svg"
                        }
                        alt={displayedUser?.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {actionText}
                        </p>
                        <h3 className="font-bold text-white">
                          {displayedUser?.fullName ||
                            displayedUser?.username ||
                            "Người dùng ẩn danh"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {rating.createdAt
                            ? new Date(rating.createdAt).toLocaleDateString(
                                "vi-VN"
                              )
                            : ""}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isPositive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isPositive ? (
                            <ThumbsUp className="w-3.5 h-3.5" />
                          ) : (
                            <ThumbsDown className="w-3.5 h-3.5" />
                          )}
                          {isPositive ? "Tích cực" : "Tiêu cực"}
                        </span>
                        <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-white/10 rounded">
                          {(rating.context || "post_transaction").replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </div>

                      {rating.comment && (
                        <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 italic">
                          "{rating.comment}"
                        </p>
                      )}

                      {rating.orderId?.productId && (
                        <Link
                          to={`/product/${rating.orderId.productId._id}`}
                          className="flex items-center gap-3 mt-4 p-3 rounded-xl hover:bg-white/5 transition group border border-transparent hover:border-white/10"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-gray-400">
                            {rating.orderId.productId.primaryImageUrl ? (
                              <img
                                src={rating.orderId.productId.primaryImageUrl}
                                className="w-full h-full object-cover rounded-lg"
                                alt=""
                              />
                            ) : (
                              <ShoppingBag className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Sản phẩm
                            </p>
                            <p className="text-sm font-medium text-white group-hover:text-primary transition line-clamp-1">
                              {rating.orderId.productId.title}
                            </p>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Chưa có đánh giá nào
                </h3>
                <p className="text-muted-foreground">
                  Người dùng này chưa nhận được đánh giá nào cho bộ lọc này.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-border rounded-lg hover:bg-white hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-sm font-medium"
              >
                Trang trước
              </button>
              <span className="text-sm font-medium text-gray-600">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-border rounded-lg hover:bg-white hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-sm font-medium"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
