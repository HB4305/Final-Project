import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import Navigation from "../../../components/navigation";
import ratingService from "../../services/ratingService";
import { useAuth } from "../../context/AuthContext";

export default function RatingsPage() {
  const { userId: paramUserId } = useParams();
  const { currentUser } = useAuth();
  const userId = paramUserId || currentUser?.id || currentUser?._id;

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
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (userId) {
      fetchRatings();
    } else if (!loading) {
      // Only invalid if we are not loading and still have no ID
      setError("User not found");
    }
  }, [userId, pagination.page, filter]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError("");

      // Determine type based on filter
      const type = filter === "given" ? "given" : "received";

      // Fetch user summary using ratingService (stats) and ratings
      const [statsRes, ratingsRes] = await Promise.all([
        ratingService.getUserRatingStats(userId),
        ratingService.getUserRatings(
          userId,
          pagination.page,
          pagination.limit,
          type
        ),
      ]);

      // Handle stats response (direct data)
      if (statsRes.data?.status === "success") {
        setUserInfo({
          ...currentUser, // Fallback if we are viewing own profile
          ratingSummary: statsRes.data.data,
        });
      }

      // Handle ratings response
      if (ratingsRes.data?.status === "success") {
        setRatings(ratingsRes.data.data.ratings);
        setPagination({
          page: ratingsRes.data.data.page,
          totalPages: ratingsRes.data.data.pages,
          total: ratingsRes.data.data.total,
          limit: 10,
        });
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
      // Fallback: If stats fail, user might not have ratings yet
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };

  if (loading && !ratings.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Header */}
          <div className="bg-background border border-border rounded-lg p-6 mb-6">
            <h1 className="text-3xl font-bold mb-4">
              Ratings for {userInfo?.fullName || userInfo?.username}
            </h1>

            {/* Rating Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  {(userInfo?.ratingSummary?.score || 0).toFixed(1)}
                </p>
                <div className="flex items-center justify-center gap-1 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(userInfo?.ratingSummary?.score || 0)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold">
                  {userInfo?.ratingSummary?.totalCount || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total Ratings
                </p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {userInfo?.ratingSummary?.countPositive || 0}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground">
                    Positive
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {userInfo?.ratingSummary?.countNegative || 0}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground">
                    Negative
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 border-b-2 font-medium whitespace-nowrap ${
                filter === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              All Received
            </button>
            <button
              onClick={() => handleFilterChange("given")}
              className={`px-4 py-2 border-b-2 font-medium whitespace-nowrap ${
                filter === "given"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => handleFilterChange("buyer_to_seller")}
              className={`px-4 py-2 border-b-2 font-medium whitespace-nowrap ${
                filter === "buyer_to_seller"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              As Seller
            </button>
            <button
              onClick={() => handleFilterChange("seller_to_buyer")}
              className={`px-4 py-2 border-b-2 font-medium whitespace-nowrap ${
                filter === "seller_to_buyer"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              As Buyer
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Ratings List */}
          <div className="space-y-4 mb-6">
            {ratings.length > 0 ? (
              ratings.map((rating) => {
                // Determine who to show: rater (if received) or ratee (if given)
                const displayedUser =
                  filter === "given" ? rating.rateeId : rating.raterId;
                const actionText = filter === "given" ? "Rated to" : "Rated by";

                return (
                  <div
                    key={rating._id}
                    className="bg-background border border-border rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            displayedUser?.profileImageUrl || "/placeholder.svg"
                          }
                          alt={displayedUser?.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">
                            {displayedUser?.fullName || displayedUser?.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {actionText} • {rating.context.replace(/_/g, " ")} •{" "}
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rating.score === 1 ? (
                          <>
                            <ThumbsUp className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              Positive
                            </span>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">
                              Negative
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Product Info if available */}
                    {rating.orderId?.productId && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                        <img
                          src={
                            rating.orderId.productId.primaryImageUrl ||
                            "/placeholder.svg"
                          }
                          alt={rating.orderId.productId.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Product:
                          </p>
                          <a
                            href={`/product/${rating.orderId.productId._id}`}
                            className="text-sm font-medium hover:underline text-primary"
                          >
                            {rating.orderId.productId.title}
                          </a>
                        </div>
                      </div>
                    )}

                    {rating.comment && (
                      <p className="text-sm text-foreground mt-3 pl-15">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-background border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground">No ratings found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
