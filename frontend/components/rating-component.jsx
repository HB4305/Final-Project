import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Star } from 'lucide-react';
import orderService from '../app/services/orderService';

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
  existingRating = null
}) {
  const [rating, setRating] = useState(existingRating?.rating || null); // 1 or -1
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [isSubmitted, setIsSubmitted] = useState(!!existingRating);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      alert('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      alert('Please provide a comment');
      return;
    }

    try {
      await orderService.rateTransaction(transactionId, {
        score: rating,
        comment: comment.trim(),
      });
      
      setIsSubmitted(true);
    
      onSubmitRating && onSubmitRating({
        transactionId,
        targetUserId: targetUser.id,
        rating,
        comment: comment.trim(),
      });

      alert('Rating submitted successfully.');
    } catch (error) {
      alert('Error: ' + (error.message || 'Failed to submit rating'));
    }

  };

  const handleUpdate = () => {
    setIsSubmitted(false);
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">
          Rate {userType === 'buyer' ? 'the Seller' : 'the Buyer'}
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
            Current Rating: {targetUser.rating} ★ ({targetUser.totalRatings} reviews)
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
                Your rating has been submitted
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-800">Rating:</span>
                <span className={`px-2 py-1 rounded text-sm font-bold ${
                  rating === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {rating === 1 ? '+1 Positive' : '-1 Negative'}
                </span>
              </div>
              <div>
                <span className="text-sm text-green-800 block mb-1">Your Comment:</span>
                <p className="text-sm bg-white p-2 rounded border border-green-200">{comment}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleUpdate}
            className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium"
          >
            Update Rating
          </button>
        </div>
      ) : (
        /* Rating Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              How was your experience?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                  rating === 1
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <ThumbsUp className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-bold">Positive</p>
                  <p className="text-xs">+1</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setRating(-1)}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                  rating === -1
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <ThumbsDown className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-bold">Negative</p>
                  <p className="text-xs">-1</p>
                </div>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Your Comment (Required)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this user..."
              rows="4"
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your feedback helps build a trusted community
            </p>
          </div>

          {/* Quick Comment Suggestions */}
          {rating && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {rating === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setComment('Great communication and fast delivery!')}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-primary hover:text-white transition"
                    >
                      Great communication
                    </button>
                    <button
                      type="button"
                      onClick={() => setComment('Item exactly as described, highly recommended!')}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-primary hover:text-white transition"
                    >
                      As described
                    </button>
                    <button
                      type="button"
                      onClick={() => setComment('Smooth transaction, would do business again!')}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-primary hover:text-white transition"
                    >
                      Smooth transaction
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setComment('Item not as described')}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-red-500 hover:text-white transition"
                    >
                      Not as described
                    </button>
                    <button
                      type="button"
                      onClick={() => setComment('Poor communication')}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-red-500 hover:text-white transition"
                    >
                      Poor communication
                    </button>
                    <button
                      type="button"
                      onClick={() => setComment('Did not complete transaction')}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-red-500 hover:text-white transition"
                    >
                      Did not complete
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
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : rating === -1
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Submit Rating
          </button>
        </form>
      )}

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-semibold mb-1">Rating Guidelines:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Be honest and fair in your assessment</li>
          <li>You can update your rating later if circumstances change</li>
          <li>Ratings impact user reputation and privileges</li>
        </ul>
      </div>
    </div>
  );
}
