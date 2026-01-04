import React, { useState } from "react";
import { UserCheck, AlertCircle, User, Clock } from "lucide-react";
import * as productService from "../app/services/productService";
import Toast from "./Toast";

/**
 * ApproveFirstTimeBidder Component
 * Allows seller to approve first-time bidders to participate in auction
 * POST /api/products/:productId/approve-bidder
 */
export default function ApproveFirstTimeBidder({ productId, bidder, onApprove }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const handleApprove = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await productService.approveFirstTimeBidder(
        productId,
        bidder._id || bidder.id
      );

      if (response.success) {
        setToast({
          type: "success",
          message: `✅ Đã duyệt ${bidder.username || bidder.name} thành công!`,
          onClose: () => {
            setShowModal(false);
            if (onApprove) {
              onApprove(response.data);
            }
          },
        });
      } else {
        setError(response.message || "Không thể duyệt bidder");
      }
    } catch (err) {
      console.error("Error approving bidder:", err);
      setError(
        err.response?.data?.message || "Đã xảy ra lỗi khi duyệt bidder"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => {
            setToast(null);
            if (toast.onClose) toast.onClose();
          }}
        />
      )}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition text-sm"
        title="Duyệt bidder này"
      >
        <UserCheck className="w-4 h-4" />
        Duyệt
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                <UserCheck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Duyệt First-Time Bidder
                </h3>
                <p className="text-sm text-gray-400">
                  Cho phép{" "}
                  <strong className="text-white">
                    {bidder.username || bidder.name}
                  </strong>{" "}
                  tham gia đấu giá
                </p>
              </div>
            </div>

            {/* Bidder Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {bidder.username || bidder.name}
                  </p>
                  <p className="text-xs text-gray-400">{bidder.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Người dùng lần đầu tham gia đấu giá</span>
              </div>
            </div>

            {/* Info */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-green-400 mb-2">
                ℹ️ Sau khi duyệt:
              </p>
              <ul className="list-disc list-inside text-sm text-green-300/90 space-y-1">
                <li>Bidder này có thể đặt giá cho sản phẩm của bạn</li>
                <li>Họ sẽ nhận được email thông báo</li>
                <li>Có thể xem lịch sử đặt giá của họ</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                <UserCheck className="w-4 h-4" />
                {loading ? "Đang xử lý..." : "Xác nhận duyệt"}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                disabled={loading}
                className="px-6 py-3 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 disabled:opacity-50 transition font-medium border border-white/10"
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
