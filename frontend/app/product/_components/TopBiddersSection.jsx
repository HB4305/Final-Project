/**
 * Top Bidders Section Component
 * Danh sách người đặt giá cao nhất
 */

import { Trophy, Medal, Award } from 'lucide-react';
import { formatPrice, formatDateShort } from './utils';

// Badge icons for top 3 bidders
const getBadge = (rank) => {
  switch(rank) {
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
  switch(rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300';
    case 2:
      return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300';
    case 3:
      return 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300';
    default:
      return 'bg-white border-border';
  }
};

export default function TopBiddersSection({ bidders = [] }) {
  if (!bidders || bidders.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Chưa có người đặt giá nào</p>
      </div>
    );
  }

  // Sort by amount descending and take top 5
  const topBidders = [...bidders]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Top người đặt giá cao nhất</h3>
      <div className="space-y-2">
        {topBidders.map((bidder, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;

          return (
            <div 
              key={bidder._id || index}
              className={`${getBadgeColor(rank)} border rounded-lg p-4 transition hover:shadow-md`}
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
                      {bidder.bidderUsername || bidder.username || 'Người dùng ẩn danh'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(bidder.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right: Bid Amount */}
                <div className="text-right shrink-0">
                  <p className={`font-bold ${isTop3 ? 'text-lg' : 'text-base'}`}>
                    {formatPrice(bidder.amount)}
                  </p>
                  {isTop3 && (
                    <p className="text-xs text-muted-foreground">
                      {rank === 1 ? 'Giá cao nhất' : rank === 2 ? 'Á quân' : 'Thứ 3'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Bidders Count */}
      {bidders.length > 5 && (
        <p className="text-center text-sm text-muted-foreground pt-2">
          Và {bidders.length - 5} người đặt giá khác
        </p>
      )}
    </div>
  );
}
