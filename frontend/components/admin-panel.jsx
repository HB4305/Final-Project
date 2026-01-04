import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import adminService from "../app/services/adminService";
import Toast from "./Toast";

/**
 * AdminPanel Component
 * Admin management interface with 2 main tabs:
 * - Users Management
 * - Upgrade Requests (Bidder → Seller)
 */
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Quản lý người dùng và yêu cầu nâng cấp tài khoản
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-5 h-5" />
            Người dùng
          </button>
          <button
            onClick={() => setActiveTab("upgrades")}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === "upgrades"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-5 h-5" />
            Yêu cầu nâng cấp
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === "users" && (
            <UserManagement
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
          {activeTab === "upgrades" && <UpgradeRequests />}
        </div>
      </div>
    </div>
  );
}

// User Management Sub-component
function UserManagement({ searchQuery, setSearchQuery }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await adminService.getAllUsers();
      console.log('[USER MANAGEMENT] response:', response);
      console.log('[USER MANAGEMENT] response.data:', response.data);
      
      if (response.status === 200) {
        setUsers(response.data?.data?.users || []);
        console.log('[USER MANAGEMENT] users:', response.data?.data?.users);
      } else {
        setError(response.data?.message || 'Failed to load users');
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary/20 rounded-full"></div>
          <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="ml-6">
          <p className="text-lg font-semibold text-foreground">Đang tải danh sách người dùng</p>
          <p className="text-sm text-muted-foreground mt-1">Vui lòng đợi trong giây lát...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
        <button
          onClick={fetchUsers}
          className="ml-4 text-red-600 hover:text-red-800 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm người dùng..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* User List */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Người dùng
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Ngày tham gia
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {searchQuery
                    ? "No users found matching your search."
                    : "No users found."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr 
                  key={user._id} 
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowDetailModal(true);
                  }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold">{user.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.fullName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            role === "admin" || role === "superadmin"
                              ? "bg-red-100 text-red-700"
                              : role === "seller"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">
                      {user.ratingSummary?.score?.toFixed(1)} ★
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({user.ratingSummary?.score || 0})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.status
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredUsers.length} trong tổng số {users.length} người dùng
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Thông tin người dùng</h2>
                  <p className="text-blue-100">Chi tiết tài khoản</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tên đăng nhập</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedUser.username}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Họ tên</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedUser.fullName || 'Chưa cập nhật'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedUser.email}</p>
                </div>
              </div>

              {/* Roles */}
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Vai trò</label>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles?.map((role) => (
                    <span
                      key={role}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        role === "admin" || role === "superadmin"
                          ? "bg-red-100 text-red-700"
                          : role === "seller"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <label className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Xếp hạng</label>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {selectedUser.ratingSummary?.score?.toFixed(1) || '0.0'} ★
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">({selectedUser.ratingSummary?.totalCount || 0} đánh giá)</p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  selectedUser.status ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <label className={`text-sm font-semibold uppercase tracking-wide ${
                    selectedUser.status ? 'text-green-700' : 'text-red-700'
                  }`}>Trạng thái</label>
                  <p className={`text-2xl font-bold mt-1 ${
                    selectedUser.status ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {selectedUser.status ? 'Đang hoạt động' : 'Không hoạt động'}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ngày tham gia</label>
                  <p className="text-gray-900 mt-1">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cập nhật cuối</label>
                  <p className="text-gray-900 mt-1">{new Date(selectedUser.updatedAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Contact Info */}
              {selectedUser.phoneNumber && (
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Số điện thoại</label>
                  <p className="text-gray-900 mt-1">{selectedUser.phoneNumber}</p>
                </div>
              )}

              {/* Address */}
              {selectedUser.address && (
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Địa chỉ</label>
                  <p className="text-gray-900 mt-1">
                    {typeof selectedUser.address === 'object' 
                      ? `${selectedUser.address.street || ''}, ${selectedUser.address.city || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
                      : selectedUser.address}
                  </p>
                </div>
              )}

              {/* User ID */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">User ID</label>
                <p className="text-xs text-gray-600 mt-1 font-mono break-all">{selectedUser._id}</p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Upgrade Requests Sub-component
function UpgradeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchUpgradeRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const response = await adminService.getUpgradeRequests();
      if(response.status === 200) {
        setRequests(response.data?.data?.requests || []);
      }
    } catch (err) {
      console.error("Error fetching upgrade requests:", err);
      setError("Tải danh sách yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpgradeRequests();
  }, []);

  const handleApprove = (requestId) => {
    setSelectedRequestId(requestId);
    setShowConfirmModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequestId) return;

    try {
      setProcessing(selectedRequestId);
      setShowConfirmModal(false);
      const response = await adminService.approveUpgradeRequest(selectedRequestId);
      console.log("Approve response:", response);
      if (response.status === 200) {
        setToast({
          message:
            "Yêu cầu nâng cấp đã được chấp nhận! Người dùng đã trở thành người bán.",
          type: "success",
        });
        // Refresh the list
        fetchUpgradeRequests();

        // Trigger refresh of users tab if needed
        window.dispatchEvent(new CustomEvent("refreshUsers"));
      } else {
        setToast({
          message: "❌ " + (response.message || "Chấp nhận yêu cầu thất bại"),
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setToast({
        message: "❌ Đã xảy ra lỗi khi chấp nhận yêu cầu",
        type: "error",
      });
    } finally {
      setProcessing(null);
      setSelectedRequestId(null);
    }
  };

  const handleReject = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedRequestId || !rejectReason.trim()) {
      setToast({
        message: "❌ Vui lòng nhập lý do từ chối",
        type: "error",
      });
      return;
    }

    try {
      setProcessing(selectedRequestId);
      setShowRejectModal(false);
      const response = await adminService.rejectUpgradeRequest(selectedRequestId, {
        reason: rejectReason,
      });

      if (response.status === 200) {
        setToast({
          message: "Yêu cầu nâng cấp đã bị từ chối.",
          type: "success",
        });
        // Refresh the list
        fetchUpgradeRequests();
      } else {
        setToast({
          message: "❌ " + (response.message || "Từ chối yêu cầu thất bại"),
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      setToast({
        message: "❌ Đã xảy ra lỗi khi từ chối yêu cầu",
        type: "error",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary/20 rounded-full"></div>
          <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="ml-6">
          <p className="text-lg font-semibold text-foreground">Đang tải danh sách yêu cầu</p>
          <p className="text-sm text-muted-foreground mt-1">Đang xử lý thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
        <button
          onClick={fetchUpgradeRequests}
          className="ml-4 text-red-600 hover:text-red-800 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            Yêu cầu nâng cấp đang chờ xử lý
          </h2>
          <p className="text-sm text-muted-foreground">
            Người đấu giá yêu cầu trở thành người bán
          </p>
        </div>
        <button
          onClick={fetchUpgradeRequests}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Người dùng
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Ngày yêu cầu
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Đánh giá
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Tổng số lần đấu giá
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Không có yêu cầu nâng cấp nào đang chờ xử lý.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr 
                  key={request._id} 
                  className="hover:bg-muted/50 cursor-pointer transition"
                  onClick={(e) => {
                    // Không mở detail nếu click vào button
                    if (!e.target.closest('button')) {
                      setSelectedRequest(request);
                      setShowDetailModal(true);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold">
                        {request.user?.username || request.userId?.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.user?.email || request.userId?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">
                      {request.user?.ratingSummary?.score.toFixed(1) ||
                        "0"}{" "}
                      ★
                    </span>
                  </td>
                  <td className="px-4 py-3">{request.user?.ratingSummary?.countPositive || 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        request.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : request.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {request.status === "pending"
                        ? "Đang chờ"
                        : request.status === "approved"
                        ? "Đã chấp nhận"
                        : "Đã từ chối"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request._id)}
                          disabled={processing === request._id}
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processing === request._id
                            ? "Đang xử lý..."
                            : "Chấp nhận"}
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          disabled={processing === request._id}
                          className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground">
        {requests.filter((r) => r.status === "pending").length} yêu cầu đang chờ
        xử lý
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Chi tiết yêu cầu nâng cấp</h3>
                <p className="text-sm text-gray-600 mt-1">Thông tin đầy đủ về yêu cầu</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Info Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Thông tin người dùng
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tên đăng nhập</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.user?.username || selectedRequest.userId?.username || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Họ và tên</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.user?.fullName || selectedRequest.userId?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.user?.email || selectedRequest.userId?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.user?.phone || selectedRequest.userId?.phone || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.user?.address || selectedRequest.userId?.address || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vai trò hiện tại</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedRequest.user?.roles || selectedRequest.userId?.roles || []).map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            role === "admin" || role === "superadmin"
                              ? "bg-red-100 text-red-700"
                              : role === "seller"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Đánh giá và hoạt động
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Điểm đánh giá</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedRequest.user?.ratingSummary?.score?.toFixed(1) || '0.0'} ★
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đánh giá tích cực</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedRequest.user?.ratingSummary?.countPositive || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đánh giá tiêu cực</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedRequest.user?.ratingSummary?.countNegative || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Info Section */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-yellow-600" />
                  Thông tin yêu cầu
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Ngày yêu cầu</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        selectedRequest.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedRequest.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedRequest.status === "pending"
                        ? "Đang chờ xử lý"
                        : selectedRequest.status === "approved"
                        ? "Đã chấp nhận"
                        : "Đã từ chối"}
                    </span>
                  </div>
                  {selectedRequest.reviewedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Ngày xử lý</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedRequest.reviewedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                  {selectedRequest.reviewedBy && (
                    <div>
                      <p className="text-sm text-gray-600">Người xử lý</p>
                      <p className="font-semibold text-gray-900">
                        {selectedRequest.reviewedBy.fullName || selectedRequest.reviewedBy.username || 'Admin'}
                      </p>
                    </div>
                  )}
                </div>
                {selectedRequest.reviewNote && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-1">Ghi chú xử lý</p>
                    <div className="bg-white border border-gray-200 rounded p-3">
                      <p className="text-gray-900">{selectedRequest.reviewNote}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === "pending" && (
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailModal(false);
                      handleReject(selectedRequest._id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    Từ chối yêu cầu
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailModal(false);
                      handleApprove(selectedRequest._id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Chấp nhận yêu cầu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chấp nhận yêu cầu</h3>
                <p className="text-sm text-gray-600">Xác nhận nâng cấp tài khoản</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn chấp nhận yêu cầu nâng cấp này không? Người dùng sẽ trở thành người bán trong 7 ngày.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedRequestId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
              >
                Xác nhận chấp nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Từ chối yêu cầu</h3>
                <p className="text-sm text-gray-600">Cung cấp lý do từ chối</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="4"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectReason.length}/100 ký tự
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequestId(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectReason.trim().length < 10}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
