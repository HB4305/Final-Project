import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';

/**
 * BidHistory Component
 * Displays auction bid history with masked usernames (section 2.3)
 * Format: ****Khoa for privacy
 */
export default function BidHistory({ bids = [] }) {
  const maskUsername = (username) => {
    if (!username) return '****';
    // Split by space to get the last name/word
    const parts = username.trim().split(' ');
    const lastName = parts[parts.length - 1];
    
    // If the name is too short (e.g. "A"), just show it or keep masking logic safe
    if (lastName.length < 2) return `****${lastName}`;
    
    return `****${lastName}`;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Bid History</h2>
      </div>

      {bids.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No bids yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 pb-2 border-b-2 border-border font-semibold text-sm text-muted-foreground">
            <span>Time</span>
            <span>Bidder</span>
            <span className="text-right">Amount</span>
          </div>

          {/* Bid Rows */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bids.map((bid, index) => (
              <div 
                key={bid.id || index}
                className={`grid grid-cols-3 gap-4 p-3 rounded-lg transition ${
                  index === 0 ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDateTime(bid.timestamp)}
                  </span>
                </div>
                <div className="font-medium">
                  {maskUsername(bid.bidderName)}
                  {index === 0 && (
                    <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded">
                      Highest
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`font-bold ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                    ${bid.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Bids:</span>
              <span className="font-semibold">{bids.length}</span>
            </div>
            {bids.length > 0 && (
              <>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Starting Price:</span>
                  <span className="font-semibold">${bids[bids.length - 1].amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-semibold text-primary">${bids[0].amount.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
