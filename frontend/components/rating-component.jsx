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
      await orderService.rateTransaction(transactionId, {
        score: rating,
        comment: comment.trim(),
      });

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
    <div className="bg-background border border-border rounded-lg p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">
          Đánh giá {userType === "buyer" ? "Người bán" : "Người mua"}
        </h3>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-lg">
          {targetUser.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{targetUser.name}</p>
          <p className="text-sm text-muted-foreground">
            Đánh giá hiện tại: {targetUser.rating} ★ ({targetUser.totalRatings}{" "}
            lượt)
          </p>
        </div>
      </div>

      {isSubmitted ? (
        /* Display Submitted Rating */
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {rating === 1 ? (
                <ThumbsUp className="w-5 h-5 text-green-600" />
              ) : (
                <ThumbsDown className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold text-green-900">
                Đánh giá của bạn đã được gửi
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-800">Đánh giá:</span>
                <span
                  className={`px-2 py-1 rounded text-sm font-bold ${
                    rating === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {rating === 1 ? "+1 Tích cực" : "-1 Tiêu cực"}
                </span>
              </div>
              <div>
                <span className="text-sm text-green-800 block mb-1">
                  Nhận xét của bạn:
                </span>
                <p className="text-sm bg-white p-2 rounded border border-green-200">
                  {comment}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium"
          >
            Cập nhật đánh giá
          </button>
        </div>
      ) : (
        /* Rating Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Trải nghiệm của bạn thế nào?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                  rating === 1
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-border hover:bg-muted"
                }`}
              >
                <ThumbsUp className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-bold">Tích cực</p>
                  <p className="text-xs">+1</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRating(-1)}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                  rating === -1
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-border hover:bg-muted"
                }`}
              >
                <ThumbsDown className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-bold">Tiêu cực</p>
                  <p className="text-xs">-1</p>
                </div>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Nhận xét của bạn (Bắt buộc)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn với người dùng này..."
              rows="4"
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Phản hồi của bạn giúp xây dựng cộng đồng tin cậy
            </p>
          </div>

          {/* Quick Comment Suggestions */}
          {rating && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Gợi ý nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {rating === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setComment("Giao tiếp tốt và giao hàng nhanh!")
                      }
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-primary hover:text-white transition"
                    >
                      Giao tiếp tốt
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setComment("Sản phẩm đúng mô tả, rất đáng tin cậy!")
                      }
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-primary hover:text-white transition"
                    >
                      Đúng mô tả
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setComment("Giao dịch suôn sẻ, sẽ ủng hộ lần sau!")
                      }
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-primary hover:text-white transition"
                    >
                      Giao dịch suôn sẻ
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setComment("Sản phẩm không đúng mô tả")}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-red-500 hover:text-white transition"
                    >
                      Không đúng mô tả
                    </button>
                    <button
                      type="button"
                      onClick={() => setComment("Giao tiếp kém")}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-red-500 hover:text-white transition"
                    >
                      Giao tiếp kém
                    </button>
                    <button
                      type="button"
                      onClick={() => setComment("Không hoàn thành giao dịch")}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-red-500 hover:text-white transition"
                    >
                      Không hoàn thành
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!rating || !comment.trim()}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              rating === 1
                ? "bg-green-500 hover:bg-green-600 text-white"
                : rating === -1
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Gửi đánh giá
          </button>
        </form>
      )}

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-semibold mb-1">Hướng dẫn đánh giá:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Hãy trung thực và công bằng trong đánh giá của bạn</li>
          <li>Bạn có thể cập nhật đánh giá sau nếu tình huống thay đổi</li>
          <li>Đánh giá ảnh hưởng đến uy tín và quyền lợi của người dùng</li>
        </ul>
      </div>
    </div>
  );
}
