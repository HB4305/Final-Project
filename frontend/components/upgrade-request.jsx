import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, ChevronDown, RefreshCw } from 'lucide-react';
import userService from "../app/services/userService.js"
import { useAuth } from "../app/context/AuthContext";

/**
 * UpgradeRequest Component
 * Bidders can request upgrade to seller status (section 2.6)
 * Admin reviews and approves within 7 days
 */
export default function UpgradeRequest({
  currentUser: initialUser,
  existingRequest = null
}) {
  const { checkAuthStatus } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(!!existingRequest);
  const [requestStatus, setRequestStatus] = useState(existingRequest?.status || null);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch user data if not provided
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userService.getMe();
        console.log("[UPGRADE UI]: ", response);
        console.log("[User Data]: ", response.data);

        // Lấy data từ response.data.user theo cấu trúc API trả về
        setCurrentUser(response.data.user);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    };

    if (!initialUser) {
      fetchUserData();
    }
  }, [initialUser]);

  // Poll for upgrade request status changes and auto-refresh auth
  useEffect(() => {
    if (!isSubmitted || requestStatus !== 'pending') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await userService.getMe();
        const userData = response.data.user;
        
        // Check if user has been upgraded to seller
        if (userData.roles?.includes('seller')) {
          console.log('[UPGRADE] User upgraded to seller, refreshing auth...');
          setRequestStatus('approved');
          // Refresh auth context to update roles immediately
          await checkAuthStatus();
          setIsExpanded(true); // Auto expand to show success
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling upgrade status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [isSubmitted, requestStatus, checkAuthStatus]);

  // Show loading state
  if (isLoading || !currentUser) {
    return (
      <div className="bg-background border border-border rounded-lg p-6 mb-8 text-center">
        <p className="text-muted-foreground">Đang tải dữ liệu người dùng...</p>
      </div>
    );
  }

  // Check if user is already a seller
  const isSeller = currentUser.roles?.includes('seller');
  const isEligible = currentUser.ratingSummary?.totalCount >= 80;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await userService.submitUpgradeRequest({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRating: currentUser.rating,
      totalBids: currentUser.totalBids,
      reason: reason.trim(),
      requestDate: new Date().toISOString(),
      status: 'pending'
    });
    setIsSubmitted(true);
    setRequestStatus('pending');
  };

  // If user is already a seller, show seller status component
  if (isSeller) {
    return (
      <div className="bg-background border border-border rounded-lg mb-8">
        {/* Dropdown Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-green-800">Verified Seller Status</h3>
              <p className="text-sm text-green-600">Click to view seller benefits and dashboard</p>
            </div>
          </div>
          <ChevronDown
            className={`w-6 h-6 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-border pt-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-700 mb-6 text-center">
                Congratulations! You have full seller privileges on our platform.
              </p>

              {/* Seller Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-600">{currentUser.ratingSummary?.score}</p>
                  <p className="text-xs text-gray-600">Your Rating</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-600">
                    {currentUser.ratingSummary?.totalCount}
                  </p>
                  <p className="text-xs text-gray-600">Total Ratings</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-600">
                    {currentUser.ratingSummary.countPositive}
                  </p>
                  <p className="text-xs text-gray-600">Positive</p>
                </div>
              </div>

              {/* Active Benefits */}
              <div className="p-6 bg-white border border-green-200 rounded-lg mb-6">
                <h4 className="font-semibold text-green-900 mb-4 text-center">Your Active Seller Benefits</h4>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                    <span>List unlimited items for auction</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                    <span>Access to seller dashboard and analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                    <span>Manage bids and communicate with buyers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                    <span>Verified seller badge on all your listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                    <span>Priority customer support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  if (isSubmitted) {
    return (
      <div className="bg-background border border-border rounded-lg mb-8">
        {/* Dropdown Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${requestStatus === 'pending' ? 'bg-yellow-100' :
              requestStatus === 'approved' ? 'bg-green-100' : 'bg-red-100'
              }`}>
              {requestStatus === 'pending' && <AlertCircle className="w-6 h-6 text-yellow-600" />}
              {requestStatus === 'approved' && <CheckCircle className="w-6 h-6 text-green-600" />}
              {requestStatus === 'rejected' && <AlertCircle className="w-6 h-6 text-red-600" />}
            </div>
            <div className="text-left">
              <h3 className={`text-xl font-bold ${requestStatus === 'pending' ? 'text-yellow-800' :
                requestStatus === 'approved' ? 'text-green-800' : 'text-red-800'
                }`}>
                {requestStatus === 'pending' && 'Upgrade Request Pending'}
                {requestStatus === 'approved' && 'Upgrade Request Approved'}
                {requestStatus === 'rejected' && 'Upgrade Request Rejected'}
              </h3>
              <p className={`text-sm ${requestStatus === 'pending' ? 'text-yellow-600' :
                requestStatus === 'approved' ? 'text-green-600' : 'text-red-600'
                }`}>
                Click to view details
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-6 h-6 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-border pt-6">
            {requestStatus === 'pending' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
                <p className="text-muted-foreground mb-6">
                  Your seller upgrade request has been submitted successfully.
                  Our admin team will review it within 7 days.
                </p>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <h3 className="font-semibold mb-2">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ Admin will review your profile and bidding history</li>
                    <li>✓ If approved, seller features will be activated immediately</li>
                    <li>✓ Review typically takes 3-7 business days</li>
                  </ul>
                </div>
              </div>
            )}

            {requestStatus === 'approved' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-green-700">Request Approved!</h2>
                <p className="text-muted-foreground mb-6">
                  Congratulations! You are now a verified seller on our platform.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 mb-3">
                    <strong>Important:</strong> To access seller features, please refresh your session.
                  </p>
                  <button 
                    onClick={async () => {
                      setIsRefreshing(true);
                      try {
                        await checkAuthStatus();
                        // Reload page to reflect new role
                        window.location.reload();
                      } catch (error) {
                        console.error('Error refreshing:', error);
                        setIsRefreshing(false);
                      }
                    }}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh & Start Selling'}
                  </button>
                </div>
              </div>
            )}

            {requestStatus === 'rejected' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-red-700">Request Denied</h2>
                <p className="text-muted-foreground mb-6">
                  Unfortunately, your seller upgrade request was not approved at this time.
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
        )}
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg mb-8">
      {/* Dropdown Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isEligible ? 'bg-primary/10' : 'bg-red-100'
            }`}>
            {isEligible ? (
              <ShieldCheck className="w-6 h-6 text-primary" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">
              {isEligible ? 'Upgrade to Seller' : 'Seller Upgrade (Not Eligible)'}
            </h3>
            <p className={`text-sm ${isEligible ? 'text-primary' : 'text-red-600'}`}>
              {isEligible ? 'Click to submit upgrade request' : 'Click to view requirements'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border pt-6">
          {/* Eligibility Check */}
          {!isEligible ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Not Eligible</p>
                  <p className="text-sm text-red-800">
                    You need at least 80% positive ratings to become a seller.
                    Current rating: {currentUser.ratingSummary?.totalCount > 0 ? ((currentUser.ratingSummary.countPositive / currentUser.ratingSummary.totalCount) * 100).toFixed(1) : "0.0"}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{currentUser.rating || 0}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{currentUser.totalBids || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Bids</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">
                    {currentUser.ratingSummary.totalCount 
                      ? `${((currentUser.ratingSummary.countPositive / currentUser.ratingSummary.totalCount) * 100).toFixed(0)}%`
                      : '0%'}
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
                    Admin will review your profile within 7 days.
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
      )}
    </div>
  );
}
