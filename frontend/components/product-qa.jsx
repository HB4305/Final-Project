import { useState, useEffect } from "react";
import { MessageSquare, Send, User, Clock, AlertCircle } from "lucide-react";
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
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setToast({ message: "Please log in to ask a question.", type: "error" });
      return;
    }

    if (!newQuestion.trim()) return;

    if (isSeller) {
      setToast({
        message: "Sellers cannot ask questions about their own products.",
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
          message: "Your question has been submitted.",
          type: "success",
        });
      } else {
        setToast({ message: result.error, type: "error" });
      }
    } catch (err) {
      setToast({ message: "Failed to submit question.", type: "error" });
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
          message: "Your answer has been submitted.",
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Failed to submit answer.",
          type: "error",
        });
      }
    } catch (err) {
      setToast({ message: "Failed to submit answer.", type: "error" });
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

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary">
            <span className="ml-3 text-muted-foreground">Loading...</span>
          </div>
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
        <h2 className="text-xl font-bold">Questions & Answers</h2>
        <span className="text-sm text-muted-foreground">
          ({questions.length})
        </span>
      </div>

      {/* Ask Question Form - Only for buyers */}
      {isLoggedIn && !isSeller && (
        <form onSubmit={handleSubmitQuestion} className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Ask the seller a question
          </label>
          <div className="flex gap-2">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Type your question here..."
              rows="3"
              className="flex-1 px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <button
              type="submit"
              disabled={!newQuestion.trim() || submitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The seller will be notified via email
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
            <p>No questions yet. Be the first to ask!</p>
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
                        placeholder="Type your answer or reply..."
                        rows="2"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitReply(q._id)}
                          disabled={submitting}
                          className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition"
                        >
                          {isSeller ? "Send Answer" : "Send Reply"}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          className="px-3 py-1 border border-border rounded text-sm hover:bg-muted transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(q._id)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {q.answers && q.answers.length > 0
                        ? "Reply to thread"
                        : "Answer this question"}
                    </button>
                  )}
                </div>
              ) : (
                (!q.answers || q.answers.length === 0) && (
                  <div className="ml-11 text-sm text-muted-foreground italic">
                    Waiting for seller's response...
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
