import React, { useState } from 'react';
import { LogOut, AlertCircle, Info } from 'lucide-react';
import * as productService from '../app/services/productService';

/**
 * WithdrawBid Component
 * Allows bidder to withdraw their own bids from an auction
 * API 3.3b: POST /api/products/:productId/withdraw-bid
 */
export default function WithdrawBid({ productId, currentBid, onWithdraw }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await productService.withdrawBid(
        productId,
        reason.trim() || 'Bidder tự rút lại giá'
      );

      if (response.success) {
        alert('✅ Đã rút giá thành công!');
        setShowModal(false);
        if (onWithdraw) {
          onWithdraw(response.data);
        }
      } else {
        setError(response.message || 'Không thể rút giá');
      }
    } catch (err) {
      console.error('Error withdrawing bids:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi rút giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        Rút giá
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rút lại giá đặt</h3>
                <p className="text-sm text-gray-600">
                  Bạn có chắc muốn rút tất cả giá đã đặt?
                </p>
              </div>
            </div>

            {/* Current Bid Info */}
            {currentBid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Giá hiện tại của bạn</span>
                </div>
                <p className="text-xl font-bold text-blue-900 ml-6">
                  {currentBid.toLocaleString('vi-VN')} VND
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-orange-900 mb-2">
                ⚠️ Lưu ý: Hành động này sẽ:
              </p>
              <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                <li>Vô hiệu hóa tất cả giá đặt của bạn cho sản phẩm này</li>
                <li>Xóa các auto-bids đã thiết lập</li>
                <li>Chuyển người thắng cho người đặt giá thứ 2 (nếu bạn đang thắng)</li>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do rút giá <span className="text-gray-400">(Không bắt buộc)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="Ví dụ: Không còn nhu cầu mua sản phẩm này, đã tìm được sản phẩm khác..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition font-medium"
              >
                <LogOut className="w-4 h-4" />
                {loading ? 'Đang xử lý...' : 'Xác nhận rút giá'}
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
