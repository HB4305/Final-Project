import { Star, Award, ShieldCheck, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import { calculatePositiveRate } from './utils';
import { FALLBACK_IMAGE } from './constants';
import { Link } from 'react-router-dom';

export default function SellerInfoCard({ seller }) {
  if (!seller) return null;

  const rating = seller.ratingSummary || {};
  const positiveRate = calculatePositiveRate(seller);
  const avatarUrl = seller.profileImageUrl || seller.avatar || FALLBACK_IMAGE.AVATAR;
  // Calculate percentage dynamically
  const total = rating.totalCount || rating.totalRatings || 0;
  const positive = rating.countPositive || 0;
  const averageRating = total > 0 ? (positive / total) * 100 : 0;
  const ratingCount = total;

  return (
    <div className="glass-card border border-white/20 rounded-2xl p-6 space-y-5 bg-[#1e293b]/80 backdrop-blur-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Thông tin người bán</h3>
        {seller.role === 'seller' && (
          <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg shadow-md flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>

      {/* Avatar & Name */}
      <div className="flex items-center gap-4">
        <div className="relative">
            <img 
            src={avatarUrl}
            alt={seller.username}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg"
            onError={(e) => { e.target.src = FALLBACK_IMAGE.AVATAR; }}
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" title="Online"></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <Link to={`/profile/ratings/${seller._id}`} className="font-bold text-lg text-white hover:text-primary transition truncate block">
            {seller.username}
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Tham gia {seller.createdAt ? new Date(seller.createdAt).getFullYear() : 'N/A'}</span>
             {seller.address?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {seller.address.city}</span>}
          </div>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
           <div className="col-span-2 bg-white/5 p-3 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors">
                <p className="text-xs text-gray-400 mb-1">Đánh giá trung bình</p>
                <div className="flex items-center justify-center gap-1 font-bold text-white text-lg">
                    {/* <Star className="w-5 h-5 text-yellow-500 fill-current" /> */}
                    {averageRating.toFixed(1)}%
                    <span className="text-gray-400 font-normal text-sm">({ratingCount} lượt)</span>
                </div>
           </div>

      </div>

      {/* Action */}

    </div>
  );
}
