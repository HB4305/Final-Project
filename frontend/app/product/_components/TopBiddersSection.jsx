/**
 * Top Bidders Section Component
 * Danh sách người đặt giá cao nhất
 */

import { Trophy, Medal, Award } from 'lucide-react';
import { formatPrice, formatDateShort } from './utils';
import RejectBidder from '../../../components/reject-bidder';

// Badge icons for top 3 bidders
const getBadge = (rank) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-orange-600" />;
    default:
      return null;
  }
};

// Badge color for top 3
const getBadgeColor = (rank) => {
  switch (rank) {
    case 1:
      return 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
    case 2:
      return 'bg-gray-400/10 border-gray-400/50 shadow-[0_0_15px_rgba(156,163,175,0.1)]';
    case 3:
      return 'bg-orange-600/10 border-orange-600/50 shadow-[0_0_15px_rgba(234,88,12,0.1)]';
    default:
      return 'bg-white/5 border-white/10';
  }
};

export default function TopBiddersSection({ bidders = [], productId, isSeller = false, onReject }) {
  if (!bidders || bidders.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Chưa có người đặt giá nào</p>
      </div>
    );
  }

  // ✅ Mask username function - hiển thị phần đầu, mask phần sau
  const maskUsername = (username) => {
    if (!username || username === 'Người dùng ẩn danh') return username;
    if (username.length <= 3) return '****';
    // Lấy 3 ký tự đầu + ****
    return username.slice(0, 3) + '****';
  };

  // Sort by amount descending - hiển thị tất cả
  const allBidders = [...bidders].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Danh sách người đặt giá ({allBidders.length})</h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {allBidders.map((bidder, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={bidder._id || index}
              className={`${getBadgeColor(rank)} border rounded-xl p-4 transition-all duration-300 hover:scale-[1.01] flex flex-col backdrop-blur-md`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Rank + User Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Rank Badge */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 font-bold shrink-0">
                    {isTop3 ? getBadge(rank) : <span className="text-muted-foreground">#{rank}</span>}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {maskUsername(bidder.bidderUsername || bidder.username || 'Người dùng ẩn danh')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(bidder.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right: Bid Amount + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`font-bold ${isTop3 ? 'text-lg text-primary-foreground' : 'text-base text-foreground'}`}>
                      {formatPrice(bidder.amount)}
                    </p>
                    {isTop3 && (
                      <p className={`text-xs font-medium ${
                        rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-orange-400'
                      }`}>
                        {rank === 1 ? 'Giá cao nhất' : rank === 2 ? 'Á quân' : 'Thứ 3'}
                      </p>
                    )}
                  </div>

                  {/* Reject Button - Only visible to seller */}
                  {isSeller && productId && (
                    <RejectBidder
                      productId={productId}
                      bidder={{
                        _id: bidder.bidderId || bidder._id,
                        username: bidder.bidderUsername || bidder.username,
                        currentBid: bidder.amount
                      }}
                      onReject={onReject}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Bidders Count */}

    </div>
  );
}
