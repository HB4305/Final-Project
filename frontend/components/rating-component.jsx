import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Star } from "lucide-react";
import orderService from "../app/services/orderService";
import Toast from "./Toast";

/**
 * RatingComponent
 * Rate users (+1 or -1) with comments (sections 2.5, 3.5)
 * Used for both buyer rating seller and seller rating buyer
 */
export default function RatingComponent({
  targetUser,
  transactionId,
  userType, // 'buyer' or 'seller'
  onSubmitRating,
  existingRating = null,
  customSubmitAction = null,
}) {
  const [rating, setRating] = useState(existingRating?.rating || null); // 1 or -1
  const [comment, setComment] = useState(existingRating?.comment || "");
  const [isSubmitted, setIsSubmitted] = useState(!!existingRating);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      setToast({ message: "Vui lòng chọn đánh giá", type: "error" });
      return;
    }

    if (!comment.trim()) {
      setToast({ message: "Vui lòng nhập nhận xét", type: "error" });
      return;
    }

    try {
      if (customSubmitAction) {
        await customSubmitAction({
          transactionId,
          score: rating,
          comment: comment.trim(),
        });
      } else {
        await orderService.rateTransaction(transactionId, {
          score: rating,
          comment: comment.trim(),
        });
      }

      setIsSubmitted(true);

      onSubmitRating &&
        onSubmitRating({
          transactionId,
          targetUserId: targetUser.id,
          rating,
          comment: comment.trim(),
        });

      setToast({ message: "Gửi đánh giá thành công.", type: "success" });
    } catch (error) {
      setToast({
        message: "Lỗi: " + (error.message || "Không thể gửi đánh giá"),
        type: "error",
      });
    }
  };

  const handleUpdate = () => {
    setIsSubmitted(false);
  };

  return (
    <div className="glass-card bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <Star className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white">
          Đánh giá {userType === "buyer" ? "Người bán" : "Người mua"}
        </h3>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-lg">
          {targetUser.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-lg text-white">{targetUser.name}</p>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <span className="text-primary font-semibold">
              Đánh giá hiện tại: {targetUser.totalRatings > 0 ? (targetUser.rating || 0).toFixed(0) : 0}%
            </span>
            <span className="text-gray-500">
              ({targetUser.totalRatings || 0} lượt)
            </span>
          </p>
        </div>
      </div>

      {isSubmitted ? (
        /* Display Submitted Rating */
        <div className="space-y-4">
          <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              {rating === 1 ? (
                <ThumbsUp className="w-6 h-6 text-green-400" />
              ) : (
                <ThumbsDown className="w-6 h-6 text-red-400" />
              )}
              <span className="font-bold text-green-400 text-lg">
                Đánh giá đã được gửi
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Trạng thái:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${rating === 1
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                >
                  {rating === 1 ? "+1 Tích cực" : "-1 Tiêu cực"}
                </span>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-gray-400 block mb-2 uppercase tracking-wider font-semibold">
                  Nhận xét của bạn:
                </span>
                <p className="text-sm text-gray-200 leading-relaxed">
                  {comment}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-semibold text-gray-300"
          >
            Cập nhật đánh giá
          </button>
        </div>
      ) : (
        /* Rating Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-4 ml-1">
              Trải nghiệm của bạn thế nào?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`group flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${rating === 1
                  ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                  : "border-white/5 bg-white/5 hover:border-white/20 text-gray-400 hover:text-gray-200"
                  }`}
              >
                <ThumbsUp className={`w-7 h-7 transition-transform duration-300 ${rating === 1 ? 'scale-110' : 'group-hover:scale-110'}`} />
                <div className="text-left">
                  <p className="font-bold text-lg">Tích cực</p>
                  <p className="text-xs opacity-60 text-green-500">+1 điểm</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRating(-1)}
                className={`group flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${rating === -1
                  ? "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  : "border-white/5 bg-white/5 hover:border-white/20 text-gray-400 hover:text-gray-200"
                  }`}
              >
                <ThumbsDown className={`w-7 h-7 transition-transform duration-300 ${rating === -1 ? 'scale-110' : 'group-hover:scale-110'}`} />
                <div className="text-left">
                  <p className="font-bold text-lg">Tiêu cực</p>
                  <p className="text-xs opacity-60 text-red-500">-1 điểm</p>
                </div>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 ml-1">
              <MessageSquare className="w-4 h-4 text-primary" />
              Nhận xét của bạn (Bắt buộc)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn với người dùng này..."
              rows="4"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
              required
            />
          </div>

          {/* Quick Comment Suggestions */}
          {rating && (
            <div className="animate-fade-in">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 ml-1">Gợi ý nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {rating === 1 ? (
                  <>
                    {[
                      "Giao tiếp tốt và giao hàng nhanh!",
                      "Sản phẩm đúng mô tả, rất đáng tin cậy!",
                      "Giao dịch suôn sẻ, sẽ ủng hộ lần sau!"
                    ].map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => setComment(text)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                      >
                        {text.split('!')[0]}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      "Sản phẩm không đúng mô tả",
                      "Giao diện giao tiếp kém",
                      "Không hoàn thành giao dịch"
                    ].map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => setComment(text)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300"
                      >
                        {text}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!rating || !comment.trim()}
            className={`w-full px-4 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed ${rating === 1
              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/25"
              : rating === -1
                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-red-500/25"
                : "bg-white/5 text-gray-500 border border-white/10"
              }`}
          >
            Gửi đánh giá
          </button>
        </form>
      )}
    </div>
  );
}
