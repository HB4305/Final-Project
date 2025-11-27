import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * UpgradeRequest Component
 * Bidders can request upgrade to seller status (section 2.6)
 * Admin reviews and approves within 7 days
 */
export default function UpgradeRequest({ 
  currentUser,
  onSubmitRequest,
  existingRequest = null 
}) {
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(!!existingRequest);
  const [requestStatus, setRequestStatus] = useState(existingRequest?.status || null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please provide a reason for your upgrade request');
      return;
    }

    const request = {
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRating: currentUser.rating,
      totalBids: currentUser.totalBids,
      reason: reason.trim(),
      requestDate: new Date().toISOString(),
      status: 'pending'
    };

    onSubmitRequest && onSubmitRequest(request);
    setIsSubmitted(true);
    setRequestStatus('pending');
  };

  // Check if user is eligible (80% positive rating or no ratings yet)
  const isEligible = !currentUser.totalRatings || 
    (currentUser.positiveRatings / currentUser.totalRatings) >= 0.8;

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-background border border-border rounded-lg p-6">
          {requestStatus === 'pending' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
              <p className="text-muted-foreground mb-6">
                Your seller upgrade request has been submitted successfully.
                Our admin team will review it within 7 days.
              </p>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Admin will review your profile and bidding history</li>
                  <li>✓ You'll receive an email notification about the decision</li>
                  <li>✓ If approved, seller features will be activated immediately</li>
                  <li>✓ Review typically takes 3-7 business days</li>
                </ul>
              </div>
            </div>
          )}

          {requestStatus === 'approved' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-green-700">Request Approved!</h2>
              <p className="text-muted-foreground mb-6">
                Congratulations! You are now a verified seller on our platform.
              </p>
              <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold">
                Start Selling
              </button>
            </div>
          )}

          {requestStatus === 'rejected' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-700">Request Denied</h2>
              <p className="text-muted-foreground mb-6">
                Unfortunately, your seller upgrade request was not approved at this time.
                You can reapply after 30 days.
              </p>
              {existingRequest?.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-left mb-4">
                  <p className="text-sm font-semibold text-red-900 mb-1">Reason:</p>
                  <p className="text-sm text-red-800">{existingRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Upgrade to Seller</h2>
            <p className="text-sm text-muted-foreground">Request seller privileges to list items</p>
          </div>
        </div>

        {/* Eligibility Check */}
        {!isEligible ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Not Eligible</p>
                <p className="text-sm text-red-800">
                  You need at least 80% positive ratings to become a seller. 
                  Current rating: {((currentUser.positiveRatings / currentUser.totalRatings) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{currentUser.rating || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{currentUser.totalBids || 0}</p>
                <p className="text-xs text-muted-foreground">Total Bids</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">
                  {currentUser.totalRatings 
                    ? `${((currentUser.positiveRatings / currentUser.totalRatings) * 100).toFixed(0)}%`
                    : '✓'}
                </p>
                <p className="text-xs text-muted-foreground">Positive</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
              <h3 className="font-semibold text-green-900 mb-3">Seller Benefits</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>List unlimited items for auction</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Access to seller dashboard and analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Manage bids and communicate with buyers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Seller verification badge</span>
                </li>
              </ul>
            </div>

            {/* Request Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Why do you want to become a seller?
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us about your plans, what you want to sell, your experience..."
                  rows="5"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 50 characters. Be specific and genuine.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Review Process</h4>
                <p className="text-sm text-blue-800">
                  Admin will review your profile within 7 days. You'll be notified via email 
                  about the decision. Make sure your email is verified.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
              >
                Submit Upgrade Request
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
