import React, { useState } from 'react';
import { LogOut, AlertCircle } from 'lucide-react';

/**
 * WithdrawBid Component
 * Allows bidder to withdraw their own bids from an auction
 * API 3.3: POST /api/products/:productId/withdraw-bid
 */
export default function WithdrawBid({ productId, onWithdraw }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/api/products/${productId}/withdraw-bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason.trim() || 'Bidder withdrew bid'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Your bids have been withdrawn successfully!');
        setShowModal(false);
        if (onWithdraw) {
          onWithdraw(result.data);
        }
      } else {
        setError(result.message || 'Failed to withdraw bids');
      }
    } catch (err) {
      console.error('Error withdrawing bids:', err);
      setError('An error occurred while withdrawing bids');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
      >
        <LogOut className="w-4 h-4" />
        Withdraw My Bids
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Withdraw Bids</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to withdraw all your bids?
                </p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> This action will:
              </p>
              <ul className="list-disc list-inside text-sm text-orange-700 mt-2 space-y-1">
                <li>Invalidate all your bids on this product</li>
                <li>Remove your auto-bids</li>
                <li>Transfer winner status to the next highest bidder if you are currently winning</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you withdrawing your bids? (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                  setError('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Withdrawing...' : 'Withdraw Bids'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
