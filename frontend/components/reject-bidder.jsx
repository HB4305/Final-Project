import React, { useState } from 'react';
import { UserX, AlertTriangle, User, TrendingUp } from 'lucide-react';
import * as productService from '../app/services/productService';

/**
 * RejectBidder Component
 * Allows seller to reject a bidder from participating in the auction
 * API 3.3a: POST /api/products/:productId/reject-bidder
 */
export default function RejectBidder({ productId, bidder, onReject }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await productService.rejectBidder(productId, bidder._id || bidder.id, reason);
      
      if (response.success) {
        alert(`✅ Đã từ chối bidder ${bidder.username || bidder.name} thành công!`);
        setShowModal(false);
        if (onReject) {
          onReject(response.data);
        }
      } else {
        setError(response.message || 'Không thể từ chối bidder');
      }
    } catch (err) {
      console.error('Error rejecting bidder:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi từ chối bidder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm shadow-sm"
        title="Từ chối bidder này"
      >
        <UserX className="w-4 h-4" />
        Từ chối
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Từ chối Bidder</h3>
                <p className="text-sm text-gray-600">
                  Bạn có chắc muốn từ chối <strong className="text-gray-900">{bidder.username || bidder.name}</strong>?
                </p>
              </div>
            </div>

            {/* Bidder Info */}
            {bidder.currentBid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {bidder.username || bidder.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      {bidder.currentBid?.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                ⚠️ Hành động này sẽ:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                <li>Vô hiệu hóa tất cả bids của bidder này</li>
                <li>Xóa các auto-bids đã đặt</li>
                <li>Chuyển người thắng sang bidder thứ 2 (nếu đang thắng)</li>
                <li>Chặn không cho bidder này đặt giá lại</li>
                <li><strong>Không thể hoàn tác</strong></li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Reason Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="Ví dụ: Lịch sử giao dịch không tốt, nhiều lần không thanh toán sau khi thắng đấu giá..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tối thiểu 10 ký tự. Hiện tại: {reason.length} ký tự
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading || reason.trim().length < 10}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition font-medium"
              >
                <UserX className="w-4 h-4" />
                {loading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                  setError('');
                }}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
