import React, { useState } from 'react';
import { UserX, AlertTriangle } from 'lucide-react';
import userService from '../app/services/userService';

/**
 * RejectBidder Component
 * Allows seller to reject a bidder from participating in the auction
 * API 3.3: POST /api/products/:productId/reject-bidder
 */
export default function RejectBidder({ productId, bidder, onReject }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await userService.rejectBidder(productId, bidder._id, reason);
      if (response.success) {
        alert(`Bidder ${bidder.username} has been rejected successfully!`);
        setShowModal(false);
        if (onReject) {
          onReject(response.data);
        }
      } else {
        setError(response.message || 'Failed to reject bidder');
      }
    } catch (err) {
      console.error('Error rejecting bidder:', err);
      setError('An error occurred while rejecting bidder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
      >
        <UserX className="w-4 h-4" />
        Reject Bidder
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Bidder</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to reject <strong>{bidder.username}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This action will:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                <li>Invalidate all bids from this bidder</li>
                <li>Remove their auto-bids</li>
                <li>Transfer winner status if they are currently winning</li>
                <li>Prevent them from bidding on this product again</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you are rejecting this bidder..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                rows={4}
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
                onClick={handleReject}
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rejecting...' : 'Reject Bidder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
