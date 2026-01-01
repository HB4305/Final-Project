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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground mt-4">Đang tải danh sách người dùng...</p>
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
            placeholder="Search users by name, email, or username..."
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
                <tr key={user._id} className="hover:bg-muted/50">
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
                      {user.rating?.average?.toFixed(1) || "N/A"} ★
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({user.rating?.count || 0})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
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

  const handleApprove = async (requestId) => {
    if (!confirm("Bạn có chắc chắn muốn chấp nhận yêu cầu nâng cấp này không?"))
      return;

    try {
      setProcessing(requestId);
      const response = await adminService.approveUpgradeRequest(requestId);
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
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt("Vui lòng cung cấp lý do từ chối:");
    if (!reason) return;

    try {
      setProcessing(requestId);
      const response = await adminService.rejectUpgradeRequest(requestId, {
        reason,
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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground mt-4">
          Đang tải danh sách yêu cầu...
        </p>
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
                <tr key={request._id} className="hover:bg-muted/50">
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
    </div>
  );
}
