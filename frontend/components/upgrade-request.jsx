import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import userService from "../app/services/userService.js";
import { useAuth } from "../app/context/AuthContext";

/**
 * UpgradeRequest Component
 * Bidders can request upgrade to seller status (section 2.6)
 * Admin reviews and approves within 7 days
 */
export default function UpgradeRequest({
  currentUser: initialUser,
  existingRequest = null,
}) {
  const { checkAuthStatus } = useAuth();
  const [reason, setReason] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(!!existingRequest);
  const [requestStatus, setRequestStatus] = useState(
    existingRequest?.status || null
  );
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
    if (!isSubmitted || requestStatus !== "pending") return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await userService.getMe();
        const userData = response.data.user;

        // Check if user has been upgraded to seller
        if (userData.roles?.includes("seller")) {
          console.log("[UPGRADE] User upgraded to seller, refreshing auth...");
          setRequestStatus("approved");
          // Refresh auth context to update roles immediately
          await checkAuthStatus();
          setIsExpanded(true); // Auto expand to show success
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error polling upgrade status:", error);
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
  const isSeller = currentUser.roles?.includes("seller");
  const isEligible = currentUser.ratingSummary?.score >= 80;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await userService.submitUpgradeRequest({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRating: currentUser.rating,
        totalBids: currentUser.totalBids,
        reason: reason.trim(),
        requestDate: new Date().toISOString(),
        status: "pending",
      });
      setIsSubmitted(true);
      setRequestStatus("pending");
    } catch (err) {
      console.error("Error submitting upgrade request:", err);
    }
  };

  // If user is already a seller, show seller status component
  if (isSeller) {
    return (
      <div className="glass-card bg-white/5 border border-white/10 rounded-2xl mb-8 shadow-xl backdrop-blur-md overflow-hidden animate-fade-in">
        {/* Dropdown Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-emerald-400">
                Người bán được xác thực
              </h3>
              <p className="text-sm text-gray-400">
                Nhấp để xem lợi ích của bạn
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-white/5 pt-6 animate-slide-down">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
              <p className="text-emerald-200/90 mb-8 text-center leading-relaxed">
                Xin chúc mừng! Bạn hiện là một người bán được xác thực trên nền
                tảng của chúng tôi. Bạn có thể tận hưởng tất cả các lợi ích và
                tính năng dành riêng cho người bán.
              </p>

              {/* Seller Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  {
                    label: "Điểm đánh giá",
                    value: `${currentUser.ratingSummary?.score}%`,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Tổng đánh giá",
                    value: currentUser.ratingSummary?.totalCount,
                    color: "text-white",
                  },
                  {
                    label: "Tích cực",
                    value: currentUser.ratingSummary?.countPositive,
                    color: "text-emerald-400",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl text-center shadow-lg"
                  >
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Active Benefits */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="font-bold text-white mb-5 text-center flex items-center justify-center gap-2">
                  Quyền lợi người bán
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  {[
                    "Sản phẩm đấu giá không giới hạn",
                    "Bảng điều khiển & phân tích",
                    "Quản lý đấu giá chuyên nghiệp",
                    "Huy hiệu xác thực uy tín",
                    "Hỗ trợ kỹ thuật ưu tiên",
                    "Giao tiếp trực tiếp người mua",
                  ].map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isSubmitted) {
    const statusStyles = {
      pending: {
        bg: "bg-amber-500/20 border-amber-500/30",
        text: "text-amber-400",
        icon: <AlertCircle className="w-6 h-6 text-amber-400" />,
        label: "Yêu cầu đang chờ xử lý",
        subLabel: "Quản trị viên đang xem xét hồ sơ của bạn",
      },
      approved: {
        bg: "bg-emerald-500/20 border-emerald-500/30",
        text: "text-emerald-400",
        icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
        label: "Yêu cầu đã được chấp thuận",
        subLabel: "Bạn đã trở thành người bán",
      },
      rejected: {
        bg: "bg-rose-500/20 border-rose-500/30",
        text: "text-rose-400",
        icon: <AlertCircle className="w-6 h-6 text-rose-400" />,
        label: "Yêu cầu bị từ chối",
        subLabel: "Vui lòng kiểm tra lý do bên dưới",
      },
    };

    const currentStyle = statusStyles[requestStatus] || statusStyles.pending;

    return (
      <div className="glass-card bg-white/5 border border-white/10 rounded-2xl mb-8 shadow-xl backdrop-blur-md overflow-hidden animate-fade-in">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border ${currentStyle.bg}`}
            >
              {currentStyle.icon}
            </div>
            <div className="text-left">
              <h3 className={`text-xl font-bold ${currentStyle.text}`}>
                {currentStyle.label}
              </h3>
              <p className="text-sm text-gray-400">{currentStyle.subLabel}</p>
            </div>
          </div>
          <ChevronDown
            className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExpanded && (
          <div className="px-6 pb-6 border-t border-white/5 pt-6 animate-slide-down">
            {requestStatus === "pending" && (
              <div className="text-center py-4">
                <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
                  Yêu cầu nâng cấp người bán của bạn đã được gửi thành công.
                  Chúng tôi thường mất khoảng 3-7 ngày để hoàn tất quy trình xem
                  xét.
                </p>
              </div>
            )}

            {requestStatus === "approved" && (
              <div className="text-center py-4">
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 max-w-md mx-auto">
                  <p className="text-indigo-200 mb-6 font-medium">
                    Để kích hoạt các tính năng người bán, vui lòng làm mới phiên
                    làm việc.
                  </p>
                  <button
                    onClick={async () => {
                      setIsRefreshing(true);
                      try {
                        await checkAuthStatus();
                        window.location.reload();
                      } catch (error) {
                        console.error("Error refreshing:", error);
                        setIsRefreshing(false);
                      }
                    }}
                    disabled={isRefreshing}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-primary text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    {isRefreshing ? "Đang xử lý..." : "Bắt đầu bán ngay"}
                  </button>
                </div>
              </div>
            )}

            {requestStatus === "rejected" && (
              <div className="max-w-md mx-auto">
                <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                  <p className="text-sm font-bold text-rose-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Lý do từ chối:
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {existingRequest?.rejectionReason ||
                      "Không đạt yêu cầu về lịch sử giao dịch hoặc nội dung giải trình chưa đủ thuyết phục."}
                  </p>
                  <button className="mt-4 text-xs font-bold text-rose-400 hover:underline">
                    Gửi yêu cầu mới sau 30 ngày
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card bg-white/5 border border-white/10 rounded-2xl mb-8 shadow-xl backdrop-blur-md overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center border ${
              isEligible
                ? "bg-primary/20 border-primary/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                : "bg-rose-500/20 border-rose-500/30"
            }`}
          >
            {isEligible ? (
              <ShieldCheck className="w-6 h-6 text-primary" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">
              {isEligible
                ? "Nâng cấp lên Người bán"
                : "Yêu cầu nâng cấp (Chưa đủ điều kiện)"}
            </h3>
            <p
              className={`text-sm ${
                isEligible ? "text-primary/70" : "text-rose-300/70"
              }`}
            >
              {isEligible ? "Nhấp để điền đơn đăng ký" : "Nhấp để xem yêu cầu"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-white/5 pt-6 animate-slide-down">
          {!isEligible ? (
            <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-rose-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="font-bold text-rose-400 mb-1">
                    Chưa đủ điều kiện xét duyệt
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Nền tảng yêu cầu người bán phải có tối thiểu 80% đánh giá
                    tích cực.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <span className="text-xs text-gray-500">
                      Đánh giá hiện tại:
                    </span>
                    <span className="text-xs font-bold text-rose-400">
                      {currentUser.ratingSummary?.totalCount > 0
                        ? `${((currentUser.ratingSummary.score || 0) <= 1
                            ? (currentUser.ratingSummary.score || 0) * 100
                            : currentUser.ratingSummary.score || 0
                          ).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  {
                    label: "Lượt đánh giá",
                    value: currentUser.ratingSummary.totalCount || 0,
                  },
                  {
                    label: "Tỷ lệ tích cực",
                    value: `${
                      currentUser.ratingSummary.totalCount
                        ? ((currentUser.ratingSummary.score || 0) <= 1
                            ? (currentUser.ratingSummary.score || 0) * 100
                            : currentUser.ratingSummary.score || 0
                          ).toFixed(0)
                        : "0"
                    }%`,
                    highlight: true,
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white/5 border border-white/10 rounded-2xl text-center shadow-lg relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <p
                      className={`text-2xl font-bold ${
                        stat.highlight ? "text-primary" : "text-white"
                      }`}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Request Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3 ml-1">
                    Tại sao bạn muốn trở thành người bán?{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Chia sẻ về kế hoạch của bạn, các sản phẩm dự định đấu giá, kinh nghiệm bán hàng..."
                    rows="4"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    required
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                      Yêu cầu tối thiểu 10 ký tự
                    </p>
                    <p
                      className={`text-[10px] font-bold ${
                        reason.length >= 10
                          ? "text-emerald-400"
                          : "text-gray-600"
                      }`}
                    >
                      {reason.length}/10
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl -mr-12 -mt-12" />
                  <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Quy trình xem xét hồ sơ
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed relative z-10">
                    Hồ sơ của bạn sẽ được bộ phận kiểm duyệt đánh giá trong vòng{" "}
                    <strong>7 ngày làm việc</strong>. Kết quả sẽ được cập nhật
                    trực tiếp tại đây.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={reason.length < 10}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 uppercase tracking-widest text-sm"
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
