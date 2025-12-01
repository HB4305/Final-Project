import React, { useState, useEffect } from 'react';
import { Zap, Info, TrendingUp, DollarSign } from 'lucide-react';

/**
 * AutoBidForm Component
 * Automatic bidding system (section 6.2)
 * Users set max bid, system automatically bids minimum needed to win
 */
export default function AutoBidForm({ 
  productId, 
  currentBid, 
  bidIncrement = 50,
  onSubmitAutoBid 
}) {
  const [maxBid, setMaxBid] = useState('');
  const [isAutoBidEnabled, setIsAutoBidEnabled] = useState(false);
  const [currentAutoBid, setCurrentAutoBid] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const minBid = currentBid + bidIncrement;

  const handleSubmit = (e) => {
    e.preventDefault();
    const maxBidValue = parseFloat(maxBid);
    
    if (maxBidValue < minBid) {
      alert(`Maximum bid must be at least $${minBid.toLocaleString()}`);
      return;
    }

    onSubmitAutoBid && onSubmitAutoBid(productId, maxBidValue);
    setCurrentAutoBid({ maxBid: maxBidValue, currentProxy: minBid });
    setIsAutoBidEnabled(true);
    setMaxBid('');
  };

  const handleCancelAutoBid = () => {
    if (window.confirm('Are you sure you want to cancel your automatic bid?')) {
      setIsAutoBidEnabled(false);
      setCurrentAutoBid(null);
    }
  };

  return (
    <div className="bg-background border-2 border-primary/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Automatic Bidding</h3>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1 hover:bg-muted rounded"
        >
          <Info className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Info Box */}
      {showInfo && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-900">How Automatic Bidding Works</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Set your maximum bid (the highest you're willing to pay)</li>
            <li>System automatically bids the minimum needed to keep you winning</li>
            <li>Your max bid stays hidden from other bidders</li>
            <li>Saves time - no need to monitor the auction constantly</li>
            <li>If two bidders have same max, the earlier bidder wins</li>
          </ul>
        </div>
      )}

      {/* Current Auto Bid Status */}
      {isAutoBidEnabled && currentAutoBid && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">Automatic Bid Active</span>
          </div>
          <div className="space-y-1 text-sm text-green-800">
            <div className="flex justify-between">
              <span>Your Maximum Bid:</span>
              <span className="font-bold">${currentAutoBid.maxBid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Proxy Bid:</span>
              <span className="font-bold text-primary">${currentAutoBid.currentProxy.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={handleCancelAutoBid}
            className="mt-3 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
          >
            Cancel Auto Bid
          </button>
        </div>
      )}

      {/* Auto Bid Form */}
      {!isAutoBidEnabled && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter Your Maximum Bid
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="number"
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                placeholder={minBid.toString()}
                min={minBid}
                step={bidIncrement}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Minimum: ${minBid.toLocaleString()} (current bid + ${bidIncrement})
            </p>
          </div>

          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMaxBid((minBid + bidIncrement * 2).toString())}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
            >
              ${(minBid + bidIncrement * 2).toLocaleString()}
            </button>
            <button
              type="button"
              onClick={() => setMaxBid((minBid + bidIncrement * 5).toString())}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
            >
              ${(minBid + bidIncrement * 5).toLocaleString()}
            </button>
            <button
              type="button"
              onClick={() => setMaxBid((minBid + bidIncrement * 10).toString())}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
            >
              ${(minBid + bidIncrement * 10).toLocaleString()}
            </button>
          </div>

          <button
            type="submit"
            disabled={!maxBid || parseFloat(maxBid) < minBid}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Enable Automatic Bidding
          </button>
        </form>
      )}

      {/* Example Calculation */}
      {!isAutoBidEnabled && maxBid && parseFloat(maxBid) >= minBid && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">What will happen:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Your max bid: ${parseFloat(maxBid).toLocaleString()}</li>
            <li>✓ Initial bid placed: ${minBid.toLocaleString()}</li>
            <li>✓ System will auto-bid up to your max as needed</li>
          </ul>
        </div>
      )}
    </div>
  );
}
