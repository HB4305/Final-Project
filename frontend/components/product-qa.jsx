import React, { useState } from 'react';
import { MessageSquare, Send, User, Clock } from 'lucide-react';

/**
 * ProductQA Component
 * Questions & Answers section for products (sections 2.4, 3.4)
 * Buyers can ask questions, sellers can respond
 * All users see Q&A history
 */
export default function ProductQA({ 
  questions = [], 
  onSubmitQuestion, 
  onSubmitAnswer,
  currentUserId,
  sellerId,
  isSeller = false 
}) {
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      onSubmitQuestion && onSubmitQuestion(newQuestion);
      setNewQuestion('');
    }
  };

  const handleSubmitReply = (questionId) => {
    if (replyText.trim()) {
      onSubmitAnswer && onSubmitAnswer(questionId, replyText);
      setReplyText('');
      setReplyingTo(null);
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

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Questions & Answers</h2>
        <span className="text-sm text-muted-foreground">({questions.length})</span>
      </div>

      {/* Ask Question Form - Only for buyers */}
      {!isSeller && (
        <form onSubmit={handleSubmitQuestion} className="mb-6">
          <label className="block text-sm font-medium mb-2">Ask the seller a question</label>
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
              disabled={!newQuestion.trim()}
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

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="border border-border rounded-lg p-4 space-y-3">
              {/* Question */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{q.askerName}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(q.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{q.question}</p>
                </div>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div className="ml-11 pl-4 border-l-2 border-primary/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-primary">
                      Seller Response
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(q.answerTimestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{q.answer}</p>
                </div>
              ) : isSeller && currentUserId === sellerId ? (
                <div className="ml-11">
                  {replyingTo === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your answer..."
                        rows="2"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitReply(q.id)}
                          className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition"
                        >
                          Send Answer
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1 border border-border rounded text-sm hover:bg-muted transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(q.id)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Reply to this question
                    </button>
                  )}
                </div>
              ) : (
                <div className="ml-11 text-sm text-muted-foreground italic">
                  Waiting for seller's response...
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
