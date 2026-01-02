import { Star, ShoppingBag, Award } from 'lucide-react';
import { calculatePositiveRate } from './utils';
import { FALLBACK_IMAGE } from './constants';

export default function SellerInfoCard({ seller }) {
  if (!seller) return null;

  // Support both old and new field names from backend
  const rating = seller.ratingSummary || {};
  const positiveRate = calculatePositiveRate(seller);
  const avatarUrl = seller.profileImageUrl || seller.avatar || FALLBACK_IMAGE.AVATAR;
  // Prefer backend-provided normalized `seller.rating` (0..5). If absent, fall back to ratingSummary.score (0..1) converted to 0..5.
  const averageRating = seller.rating ?? (typeof rating.score === 'number' ? Number((rating.score * 5).toFixed(1)) : (seller.averageRating ?? 0));
  const ratingCount = rating.totalCount || rating.totalRatings || seller.ratingCount || 0;
  const positiveRatings = rating.countPositive || rating.positiveCount || seller.positiveRatings || 0;
  const neutralRatings = rating.countNeutral || rating.neutralCount || seller.neutralRatings || 0;
  const negativeRatings = rating.countNegative || rating.negativeCount || seller.negativeRatings || 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Thông tin người bán</h3>
        {seller.role === 'seller' && (
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
            <Award className="w-3 h-3" />
            Verified Seller
          </span>
        )}
      </div>

      {/* Avatar & Name */}
      <div className="flex items-center gap-4">
        <img 
          src={avatarUrl}
          alt={seller.username}
          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
          onError={(e) => {
            e.target.src = FALLBACK_IMAGE.AVATAR;
          }}
        />
        <div className="flex-1">
          <h4 className="font-bold text-lg">{seller.username}</h4>
          <p className="text-sm text-muted-foreground">
            Tham gia từ {new Date(seller.createdAt).getFullYear()}
          </p>
        </div>
      </div>

      {/* Rating Overview */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        {/* Stars */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="font-bold text-lg">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({ratingCount} đánh giá)
          </span>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-green-600">👍 Tích cực</span>
            <span className="font-semibold">{positiveRatings}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">😐 Trung lập</span>
            <span className="font-semibold">{neutralRatings}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-600">👎 Tiêu cực</span>
            <span className="font-semibold">{negativeRatings}</span>
          </div>
        </div>

        {/* Positive Rate Badge */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tỷ lệ hài lòng</span>
            <span className={`text-lg font-bold ${
              positiveRate >= 95 ? 'text-green-600' :
              positiveRate >= 80 ? 'text-blue-600' :
              'text-orange-600'
            }`}>
              {positiveRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
