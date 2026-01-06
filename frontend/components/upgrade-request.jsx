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
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8 text-center">
        <p className="text-gray-400">Đang tải dữ liệu người dùng...</p>
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
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-lg mb-8 shadow-xl">
        {/* Dropdown Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-green-400">Người bán được xác thực</h3>
              <p className="text-sm text-green-300/70">Nhấp để xem các lợi ích của người bán</p>
            </div>
          </div>
          <ChevronDown
            className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-white/10 pt-6">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-6">
              <p className="text-green-300 mb-6 text-center">
                Xin chúc mừng! Bạn hiện là một người bán được xác thực trên nền tảng của chúng tôi. Bạn có thể tận hưởng tất cả các lợi ích và tính năng dành riêng cho người bán.
              </p>

              {/* Seller Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-400">{currentUser.ratingSummary?.score}</p>
                  <p className="text-xs text-gray-400">Điểm đánh giá</p>
                </div>
                <div className="p-4 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-400">
                    {currentUser.ratingSummary?.totalCount}
                  </p>
                  <p className="text-xs text-gray-400">Tổng số đánh giá</p>
                </div>
                <div className="p-4 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-400">
                    {currentUser.ratingSummary.countPositive}
                  </p>
                  <p className="text-xs text-gray-400">Tích cực</p>
                </div>
              </div>

              {/* Active Benefits */}
              <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-green-500/30 rounded-lg mb-6">
                <h4 className="font-semibold text-green-400 mb-4 text-center">Lợi ích người bán</h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
                    <span>Liệt kê số lượng sản phẩm không giới hạn để đấu giá</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
                    <span>Truy cập bảng điều khiển và phân tích người bán</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
                    <span>Quản lý các đấu giá và giao tiếp với người mua</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
                    <span>Huy hiệu người bán được xác thực trên tất cả các danh sách của bạn</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
                    <span>Hỗ trợ khách hàng ưu tiên</span>
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
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-lg mb-8 shadow-xl">
        {/* Dropdown Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${requestStatus === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30' :
              requestStatus === 'approved' ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
              }`}>
              {requestStatus === 'pending' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
              {requestStatus === 'approved' && <CheckCircle className="w-6 h-6 text-green-400" />}
              {requestStatus === 'rejected' && <AlertCircle className="w-6 h-6 text-red-400" />}
            </div>
            <div className="text-left">
              <h3 className={`text-xl font-bold ${requestStatus === 'pending' ? 'text-yellow-400' :
                requestStatus === 'approved' ? 'text-green-400' : 'text-red-400'
                }`}>
                {requestStatus === 'pending' && 'Yêu cầu đang chờ xử lý'}
                {requestStatus === 'approved' && 'Yêu cầu đã được chấp thuận'}
                {requestStatus === 'rejected' && 'Yêu cầu bị từ chối'}
              </h3>
              <p className={`text-sm ${requestStatus === 'pending' ? 'text-yellow-300/70' :
                requestStatus === 'approved' ? 'text-green-300/70' : 'text-red-300/70'
                }`}>
                Nhấp để xem chi tiết
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-white/10 pt-6">
            {requestStatus === 'pending' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-white">Yêu cầu đã được gửi</h2>
                <p className="text-gray-400 mb-6">
                  Yêu cầu nâng cấp người bán của bạn đã được gửi thành công.
                  Nhóm quản trị của chúng tôi sẽ xem xét trong vòng 7 ngày.
                </p>
              </div>
            )}

            {requestStatus === 'approved' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-green-400">Yêu cầu đã được chấp thuận!</h2>
                <p className="text-gray-400 mb-6">
                  Chúc mừng! Bạn hiện là người bán được xác minh trên nền tảng của chúng tôi.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-300 mb-3">
                    <strong>Quan trọng:</strong> Để truy cập các tính năng người bán, vui lòng làm mới phiên của bạn.
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
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-semibold mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Đang làm mới...' : 'Làm mới & Bắt đầu bán'}
                  </button>
                </div>
              </div>
            )}

            {requestStatus === 'rejected' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-red-400">Yêu cầu bị từ chối</h2>
                <p className="text-gray-400 mb-6">
                  Rất tiếc, yêu cầu nâng cấp người bán của bạn không được chấp thuận vào thời điểm này.
                </p>
                {existingRequest?.rejectionReason && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left mb-4">
                    <p className="text-sm font-semibold text-red-400 mb-1">Lý do:</p>
                    <p className="text-sm text-red-300">{existingRequest.rejectionReason}</p>
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
    <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-lg mb-8 shadow-xl">
      {/* Dropdown Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isEligible ? 'bg-blue-500/20 border-blue-500/30' : 'bg-red-500/20 border-red-500/30'
            }`}>
            {isEligible ? (
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">
              {isEligible ? 'Nâng cấp lên Người bán' : 'Nâng cấp Người bán (Chưa đủ điều kiện)'}
            </h3>
            <p className={`text-sm ${isEligible ? 'text-blue-300/70' : 'text-red-300/70'}`}>
              {isEligible ? 'Nhấp để gửi yêu cầu nâng cấp' : 'Nhấp để xem yêu cầu'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-white/10 pt-6">
          {/* Eligibility Check */}
          {!isEligible ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400 mb-1">Không đủ điều kiện</p>
                  <p className="text-sm text-red-300">
                    Bạn cần ít nhất 80% đánh giá tích cực để trở thành người bán.
                    Đánh giá hiện tại: {currentUser.ratingSummary?.totalCount > 0 ? ((currentUser.ratingSummary.countPositive / currentUser.ratingSummary.totalCount) * 100).toFixed(1) : "0.0"}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">{currentUser.ratingSummary.totalCount || 0}</p>
                  <p className="text-xs text-gray-400">Đánh giá</p>
                </div>
                <div className="p-4 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {currentUser.ratingSummary.totalCount
                      ? `${((currentUser.ratingSummary.countPositive / currentUser.ratingSummary.totalCount) * 100).toFixed(0)}%`
                      : '0%'}
                  </p>
                  <p className="text-xs text-gray-400">Tích cực</p>
                </div>
              </div>

              {/* Request Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Tại sao bạn muốn trở thành người bán?
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Hãy cho chúng tôi biết về kế hoạch của bạn, bạn muốn bán gì, kinh nghiệm của bạn..."
                    rows="5"
                    className="w-full px-3 py-2 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Tối thiểu 50 ký tự.
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">Quy trình xem xét</h4>
                  <p className="text-sm text-blue-300">
                    Quản trị viên sẽ xem xét hồ sơ của bạn trong vòng 7 ngày.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-lg"
                >
                  Gửi Yêu Cầu Nâng Cấp
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
