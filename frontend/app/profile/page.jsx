import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Star,
  StarHalf,
  Edit2,
  Save,
  X,
  Loader2,
  Trophy,
  Settings,
  Bell,
  Shield,
  Camera,
  Phone,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "../../components/navigation";
import UpgradeRequest from "../../components/upgrade-request";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import Toast from "../../components/Toast";

export default function ProfilePage() {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Email update states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    fullName: "",
    dateOfBirth: "",
    contactPhone: "",
    address: {
      street: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
    },
  });

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await userService.getUserProfile();

      if (res.data?.status === "success") {
        const userData = res.data.data.user;
        setProfile(userData);
        setEditForm({
          fullName: userData.fullName || "",
          dateOfBirth: userData.dateOfBirth
            ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
            : "",
          contactPhone: userData.contactPhone || "",
          address: userData.address || {
            street: "",
            city: "",
            region: "",
            postalCode: "",
            country: "",
          },
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setToast({ message: "Failed to load profile data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- AVATAR & PROFILE UPDATE ---
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ message: "Vui lòng chọn file ảnh", type: "error" });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await userService.uploadAvatar(formData);

      if (res.data?.success) {
        const updatedProfile = {
          ...profile,
          profileImageUrl: res.data.data.profileImageUrl,
        };
        setProfile(updatedProfile);
        updateUser(updatedProfile);
        setToast({
          message: "Cập nhật ảnh đại diện thành công",
          type: "success",
        });
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setToast({
        message: err.response?.data?.message || "Lỗi khi upload ảnh",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData = {
        fullName: editForm.fullName,
        dateOfBirth: editForm.dateOfBirth || null,
        contactPhone: editForm.contactPhone || null,
        address: editForm.address,
      };

      const res = await userService.updateMe(updateData);

      if (res.data?.status === "success") {
        setProfile(res.data.data.user);
        setIsEditing(false);
        setToast({ message: "Cập nhật thông tin thành công", type: "success" });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setToast({
        message: err.response?.data?.message || "Lỗi khi cập nhật thông tin",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        contactPhone: profile.contactPhone || "",
        address: profile.address || {
          street: "",
          city: "",
          region: "",
          postalCode: "",
          country: "",
        },
      });
    }
    setIsEditing(false);
  };

  // --- EMAIL UPDATE ---
  const handleUpdateEmail = async () => {
    try {
      setEmailUpdating(true);

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!newEmail || !emailRegex.test(newEmail)) {
        setToast({ message: "Vui lòng nhập email hợp lệ", type: "error" });
        return;
      }

      const res = await userService.updateEmail({ newEmail });

      if (res.data?.status === "success") {
        setToast({
          message: "Mã OTP đã được gửi đến email mới. Vui lòng kiểm tra.",
          type: "success",
        });
        setShowEmailOtpInput(true);
        setIsEditingEmail(false);
      }
    } catch (err) {
      console.error("Error updating email:", err);
      setToast({
        message: err.response?.data?.message || "Lỗi khi cập nhật email",
        type: "error",
      });
    } finally {
      setEmailUpdating(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      setEmailOtpVerifying(true);

      if (!emailOtp || emailOtp.length !== 6) {
        setToast({ message: "Vui lòng nhập mã OTP 6 chữ số", type: "error" });
        return;
      }

      const res = await userService.verifyEmailOtp({ otp: emailOtp });

      if (res.data?.status === "success") {
        setToast({ message: "Xác thực email thành công!", type: "success" });
        setShowEmailOtpInput(false);
        setEmailOtp("");
        setNewEmail("");
        fetchProfileData();
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setToast({
        message: err.response?.data?.message || "Xác thực OTP thất bại",
        type: "error",
      });
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="pt-24 pb-12 max-w-6xl mx-auto px-4">
        {/* Banner Section */}
        <div className="relative h-48 md:h-64 rounded-t-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 overflow-hidden mb-16 animate-fade-in shadow-lg">
          <div className="absolute inset-0 bg-black/10"></div>
          {/* Decorative circles */}
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Profile Header Card (Overlapping Banner) */}
        <div className="relative -mt-24 px-6 md:px-10 mb-8 animate-slide-up">
          <div className="glass rounded-3xl p-8 shadow-xl border border-white/10 bg-gray-900/40 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 relative">
              {/* Avatar */}
              <div className="relative group -mt-16 md:-mt-20">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gray-800 shadow-2xl ring-4 ring-black/20">
                  <img
                    src={profile?.profileImageUrl || "/placeholder.svg"}
                    alt={profile?.fullName || profile?.username}
                    className="w-full h-full rounded-full object-cover border-4 border-gray-800"
                  />
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 p-2.5 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-transform hover:scale-110 border border-white/10"
                  title="Đổi ảnh đại diện"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={saving}
                />
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-2 text-center md:text-left pt-2 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-3xl font-bold text-white shadow-black drop-shadow-md">
                    {profile?.fullName || profile?.username}
                  </h1>
                  {profile?.role === "admin" && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase rounded-full self-center md:self-auto">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-gray-300 font-medium">
                  @{profile?.username}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> {profile?.email}
                  </span>
                  {profile?.address?.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {profile.address.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Tham gia{" "}
                    {new Date(profile?.createdAt).getFullYear()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 font-medium"
                  >
                    <Edit2 className="w-4 h-4" /> Chỉnh sửa
                  </button>
                )}
                <Link
                  to="/profile/settings"
                  className="p-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition"
                  title="Cài đặt"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-red-500/10 border border-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Forms */}
          <div
            className="lg:col-span-2 space-y-8 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-primary" /> Thông tin cá nhân
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={
                        isEditing ? editForm.fullName : profile?.fullName || ""
                      }
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditing
                          ? "bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-500"
                          : "bg-transparent border-transparent text-gray-400 px-0"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      disabled={!isEditing}
                      value={
                        isEditing
                          ? editForm.dateOfBirth
                          : editForm.dateOfBirth || ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditing
                          ? "bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary [color-scheme:dark]"
                          : "bg-transparent border-transparent text-gray-400 px-0"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Email
                    </label>
                    <div className="flex gap-2">
                      {isEditingEmail ? (
                        <>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Nhập email mới"
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            autoFocus
                          />
                          <button
                            onClick={handleUpdateEmail}
                            disabled={emailUpdating}
                            className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
                          >
                            {emailUpdating ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => setIsEditingEmail(false)}
                            className="p-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="email"
                            disabled
                            value={profile?.email || ""}
                            className="flex-1 px-4 py-3 bg-transparent border border-transparent rounded-xl text-gray-400 px-0"
                          />
                          {isEditing && (
                            <button
                              onClick={() => setIsEditingEmail(true)}
                              className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-medium"
                            >
                              Thay đổi
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={
                        isEditing
                          ? editForm.contactPhone
                          : profile?.contactPhone || ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          contactPhone: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditing
                          ? "bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          : "bg-transparent border-transparent text-gray-400 px-0"
                      }`}
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Địa chỉ
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="Số nhà, đường"
                      value={
                        isEditing
                          ? editForm.address.street
                          : profile?.address?.street || ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          address: {
                            ...editForm.address,
                            street: e.target.value,
                          },
                        })
                      }
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditing
                          ? "bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          : "bg-transparent border-transparent text-gray-400 px-0"
                      }`}
                    />
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="Thành phố / Tỉnh"
                      value={
                        isEditing
                          ? editForm.address.city
                          : profile?.address?.city || ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          address: {
                            ...editForm.address,
                            city: e.target.value,
                          },
                        })
                      }
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditing
                          ? "bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          : "bg-transparent border-transparent text-gray-400 px-0"
                      }`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition font-medium"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                )}
              </div>
            </div>

            <UpgradeRequest currentUser={profile} />
          </div>

          {/* Right Column: Stats & Reviews */}
          <div
            className="space-y-8 animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            {/* Review Summary Card */}
            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2 text-white">
                  <Star className="w-5 h-5 text-yellow-500" /> Uy tín người dùng
                </h2>
                <Link
                  to="/profile/ratings/me"
                  className="text-xs text-primary font-medium hover:underline flex items-center"
                >
                  Chi tiết <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="text-center py-6 bg-gradient-to-b from-yellow-500/10 to-transparent rounded-xl border border-yellow-500/10 mb-6">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => {
                    const score = profile?.ratingSummary?.score || 0;
                    const isFull = i < Math.floor(score);
                    const isHalf = i === Math.floor(score) && score % 1 >= 0.5;
                    return (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          isFull || isHalf
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-700"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {(profile?.ratingSummary?.score || 0).toFixed(1)}{" "}
                  <span className="text-sm text-gray-500 font-normal">
                    / 5.0
                  </span>
                </p>
                <p className="text-sm text-gray-400">
                  Dựa trên {profile?.ratingSummary?.totalCount || 0} lượt đánh
                  giá
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500/20 p-1.5 rounded-lg text-green-400">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-green-400">
                      Đánh giá tốt
                    </span>
                  </div>
                  <span className="font-bold text-green-400">
                    {profile?.ratingSummary?.countPositive || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <div className="bg-red-500/20 p-1.5 rounded-lg text-red-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-red-400">
                      Đánh giá xấu
                    </span>
                  </div>
                  <span className="font-bold text-red-400">
                    {profile?.ratingSummary?.countNegative || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-blue-500" /> Trạng thái tài
                khoản
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Xác thực Email</span>
                  {profile?.emailVerified ? (
                    <span className="text-xs px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/20 rounded-full font-bold">
                      Đã xác thực
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-full font-bold">
                      Chưa xác thực
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Vai trò</span>
                  <span className="text-sm font-medium capitalize text-white">
                    {profile?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Điểm uy tín</span>
                  <span className="text-sm font-bold text-primary">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showEmailOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Xác thực Email mới
              </h3>
              <button
                onClick={() => {
                  setShowEmailOtpInput(false);
                  setEmailOtp("");
                  setNewEmail("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-6 text-center">
                Mã xác thực đã được gửi đến <br />
                <strong className="text-primary text-base">{newEmail}</strong>
              </p>

              <div className="space-y-6">
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setEmailOtp(value);
                    }
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 border-2 border-primary/20 rounded-xl bg-primary/5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-center text-3xl tracking-[0.5em] font-mono font-bold text-primary placeholder-primary/30 transition-all"
                  autoFocus
                />

                <button
                  onClick={handleVerifyEmailOtp}
                  disabled={emailOtpVerifying || emailOtp.length !== 6}
                  className="w-full py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2"
                >
                  {emailOtpVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    "Xác thực ngay"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
