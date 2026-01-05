import { useState, useEffect } from "react";
import { MessageSquare, Send, User, Clock, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "../app/context/AuthContext.jsx";
import questionService from "../app/services/questionService";
import Toast from "./Toast";

/**
 * ProductQA Component
 * Questions & Answers section for products (sections 2.4, 3.4)
 * Buyers can ask questions, sellers can respond
 * All users see Q&A history
 */
export default function ProductQA({ productId, sellerId }) {
  const { currentUser, isLoggedIn } = useAuth();

  const [newQuestion, setNewQuestion] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isSeller = currentUser?._id === sellerId;

  useEffect(() => {
    loadQuestions();
  }, [productId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await questionService.getProductQuestions(productId);

      if (result.success) {
        setQuestions(result.data.questions || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Không thể tải danh sách câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setToast({ message: "Vui lòng đăng nhập để đặt câu hỏi.", type: "error" });
      return;
    }

    if (!newQuestion.trim()) return;

    if (isSeller) {
      setToast({
        message: "Người bán không thể tự đặt câu hỏi cho sản phẩm của mình.",
        type: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await questionService.createQuestion(
        productId,
        newQuestion
      );

      if (result.success) {
        setNewQuestion("");
        await loadQuestions();
        setToast({
          message: "Câu hỏi của bạn đã được gửi.",
          type: "success",
        });
      } else {
        setToast({ message: result.error, type: "error" });
      }
    } catch (err) {
      setToast({ message: "Gửi câu hỏi thất bại.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (questionId) => {
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      const result = await questionService.answerQuestion(
        questionId,
        replyText
      );

      if (result.success) {
        setReplyText("");
        setReplyingTo(null);
        await loadQuestions();
        setToast({
          message: "Câu trả lời của bạn đã được gửi.",
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Gửi câu trả lời thất bại.",
          type: "error",
        });
      }
    } catch (err) {
      setToast({ message: "Gửi câu trả lời thất bại.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  if (loading) {
    return (
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Hỏi đáp về sản phẩm</h2>
        <span className="text-sm text-muted-foreground">
          ({questions.length})
        </span>
      </div>

      {/* Ask Question Form - Only for buyers */}
      {isLoggedIn && !isSeller && (
        <form onSubmit={handleSubmitQuestion} className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Đặt câu hỏi cho người bán
          </label>
          <div className="flex gap-2">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Nhập câu hỏi của bạn tại đây..."
              rows="3"
              disabled={submitting}
              className={`flex-1 px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                submitting ? "cursor-wait opacity-50" : ""
              }`}
            />
            <button
              type="submit"
              disabled={!newQuestion.trim() || submitting}
              className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 self-end ${
                submitting ? "cursor-wait" : "disabled:cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Người bán sẽ nhận được thông báo qua email
          </p>
        </form>
      )}

      {/* Login prompt */}
      {!isLoggedIn && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            Vui lòng{" "}
            <a href="/auth/signin" className="underline font-semibold">
              đăng nhập
            </a>{" "}
            để đặt câu hỏi
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q._id}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              {/* Question */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {q.authorId?.fullName || "Người dùng"}
                    </span>
                  </div>
                  <p className="text-sm">{q.text}</p>
                </div>
              </div>

              {/* Answer */}
              {q.answers && q.answers.length > 0 && (
                <div className="ml-11 space-y-2">
                  {q.answers.map((answer, index) => (
                    <div
                      key={index}
                      className="pl-4 border-l-2 border-primary/30"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-primary">
                          {answer.authorId?.fullName || "Người dùng"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(answer.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{answer.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Section */}
              {isSeller || currentUser?._id === q.authorId?._id ? (
                <div className="ml-11 mt-2">
                  {replyingTo === q._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập câu trả lời hoặc phản hồi..."
                        rows="2"
                        disabled={submitting}
                        className={`w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm ${
                          submitting ? "cursor-wait opacity-50" : ""
                        }`}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitReply(q._id)}
                          disabled={submitting}
                          className={`px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition ${
                            submitting ? "cursor-wait" : ""
                          }`}
                        >
                          {isSeller ? "Gửi câu trả lời" : "Gửi phản hồi"}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          disabled={submitting}
                          className={`px-3 py-1 border border-border rounded text-sm hover:bg-muted transition ${
                            submitting ? "cursor-wait opacity-50" : ""
                          }`}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(q._id)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {q.answers && q.answers.length > 0
                        ? "Phản hồi"
                        : "Trả lời câu hỏi này"}
                    </button>
                  )}
                </div>
              ) : (
                (!q.answers || q.answers.length === 0) && (
                  <div className="ml-11 text-sm text-muted-foreground italic">
                    Chờ phản hồi từ người bán...
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
