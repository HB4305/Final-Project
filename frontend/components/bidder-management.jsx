import React, { useState } from 'react';
import { UserX, AlertTriangle, CheckCircle, X } from 'lucide-react';

/**
 * BidderManagement Component
 * Allows sellers to reject specific bidders from an auction (section 3.3)
 * If rejected bidder is highest, auction goes to second highest
 */
export default function BidderManagement({ 
  productId,
  bidders = [], 
  onRejectBidder,
  currentHighestBidderId 
}) {
  const [rejectingBidder, setRejectingBidder] = useState(null);
  const [reason, setReason] = useState('');

  const handleReject = (bidderId) => {
    if (window.confirm('Are you sure you want to reject this bidder? They will not be able to bid on this item again.')) {
      onRejectBidder && onRejectBidder(productId, bidderId, reason);
      setRejectingBidder(null);
      setReason('');
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserX className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">Manage Bidders</h3>
      </div>

      {bidders.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No bidders yet</p>
      ) : (
        <div className="space-y-2">
          {bidders.map((bidder) => (
            <div 
              key={bidder.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                bidder.isRejected 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                  {bidder.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{bidder.name}</span>
                    {bidder.id === currentHighestBidderId && (
                      <span className="px-2 py-0.5 bg-primary text-white text-xs rounded">
                        Highest Bidder
                      </span>
                    )}
                    {bidder.isRejected && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rating: {bidder.rating} ★ ({bidder.totalBids} bids)
                  </div>
                  {bidder.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1">
                      Reason: {bidder.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {!bidder.isRejected && (
                <button
                  onClick={() => setRejectingBidder(bidder.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-medium"
                >
                  <UserX className="w-4 h-4" />
                  Reject
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingBidder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Reject Bidder</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              This bidder will be permanently blocked from bidding on this item. 
              {bidders.find(b => b.id === rejectingBidder)?.id === currentHighestBidderId && (
                <span className="text-red-600 font-semibold block mt-2">
                  ⚠️ This is the current highest bidder. The auction will go to the second highest bidder.
                </span>
              )}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows="3"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReject(rejectingBidder)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setRejectingBidder(null);
                  setReason('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Box */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Rejection Policy</p>
            <p>
              Rejecting a bidder is permanent for this auction. Use this feature carefully
              and only when necessary (e.g., suspicious activity, poor buyer rating).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
