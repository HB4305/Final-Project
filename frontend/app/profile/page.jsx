import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Star,
  Edit2,
  Save,
  X,
  Loader2,
  Trophy,
  Settings,
  Bell,
  Shield,
} from "lucide-react";
import Navigation from "../../components/navigation";
import UpgradeRequest from "../../components/upgrade-request";
import userService from "../services/userService";
import Toast from "../../components/Toast";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);

  // Email update states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);

  // Password update states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [showPasswordOtpInput, setShowPasswordOtpInput] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState("");

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bidNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
    privateProfile: false,
  });

  const [profile, setProfile] = useState(null);

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
      const [profileRes] = await Promise.all([userService.getUserProfile()]);

      if (profileRes.data?.status === "success") {
        const userData = profileRes.data.data.user;
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
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // --- PASSWORD CHANGE FLOW ---

  const handleRequestChangePassword = async () => {
    try {
      setPasswordUpdating(true);
      setError("");
      setSuccess("");

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("Mật khẩu mới không khớp");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }

      // Step 1: Request OTP
      await userService.requestChangePassword(passwordForm.oldPassword);

      setSuccess("Mã OTP đã được gửi đến email của bạn.");
      setShowPasswordOtpInput(true);
    } catch (err) {
      console.error("Error requesting password change:", err);
      setError(
        err.response?.data?.message || "Không thể gửi yêu cầu đổi mật khẩu"
      );
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleConfirmChangePassword = async () => {
    try {
      setPasswordUpdating(true);
      setError("");
      setSuccess("");

      if (passwordOtp.length !== 6) {
        setError("Vui lòng nhập mã OTP 6 chữ số");
        return;
      }

      // Step 2: Confirm with OTP
      await userService.confirmChangePassword(
        passwordOtp,
        passwordForm.newPassword
      );

      setSuccess("Đổi mật khẩu thành công!");
      setToast({ message: "Đổi mật khẩu thành công!", type: "success" });

      // Reset states
      setIsChangingPassword(false);
      setShowPasswordOtpInput(false);
      setPasswordOtp("");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Error confirming password change:", err);
      setError(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setPasswordUpdating(false);
    }
  };

  // --- AVATAR & PROFILE UPDATE ---

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await userService.uploadAvatar(formData);

      if (res.data?.success) {
        setProfile({
          ...profile,
          profileImageUrl: res.data.data.profileImageUrl,
        });
        setSuccess("Cập nhật ảnh đại diện thành công");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err.response?.data?.message || "Lỗi khi upload ảnh");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

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
        setSuccess("Cập nhật thông tin thành công");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật thông tin");
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
    setError("");
  };

  // --- EMAIL UPDATE ---

  const handleUpdateEmail = async () => {
    try {
      setEmailUpdating(true);
      setError("");
      setSuccess("");

      if (!newEmail || !newEmail.includes("@")) {
        setError("Vui lòng nhập email hợp lệ");
        return;
      }

      const res = await userService.updateEmail({ newEmail });

      if (res.data?.status === "success") {
        setSuccess("Mã OTP đã được gửi đến email mới. Vui lòng kiểm tra.");
        setShowEmailOtpInput(true);
        setIsEditingEmail(false);
      }
    } catch (err) {
      console.error("Error updating email:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật email");
    } finally {
      setEmailUpdating(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      setEmailOtpVerifying(true);
      setError("");
      setSuccess("");

      if (!emailOtp || emailOtp.length !== 6) {
        setError("Vui lòng nhập mã OTP 6 chữ số");
        return;
      }

      const res = await userService.verifyEmailOtp({ otp: emailOtp });

      if (res.data?.status === "success") {
        setSuccess("Xác thực email thành công!");
        setShowEmailOtpInput(false);
        setEmailOtp("");
        setNewEmail("");
        fetchProfileData();
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError(err.response?.data?.message || "Xác thực OTP thất bại");
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  // --- SETTINGS ---
  const handleToggleSetting = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    // In a real app, you would save this to backend
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="pt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* OTP Verification for Email */}
          {showEmailOtpInput && (
            <div className="mb-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">
                Xác thực Email mới
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Chúng tôi đã gửi mã OTP đến <strong>{newEmail}</strong>.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setEmailOtp(value);
                    }
                  }}
                  placeholder="Nhập mã OTP"
                  maxLength={6}
                  className="flex-1 px-4 py-3 border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                />
                <button
                  onClick={handleVerifyEmailOtp}
                  disabled={emailOtpVerifying || emailOtp.length !== 6}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {emailOtpVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    "Xác thực"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEmailOtpInput(false);
                    setEmailOtp("");
                    setNewEmail("");
                  }}
                  disabled={emailOtpVerifying}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-background border border-border rounded-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <img
                    src={profile?.profileImageUrl || "/placeholder.svg"}
                    alt={profile?.fullName || profile?.username}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer text-white"
                  >
                    <Edit2 className="w-6 h-6" />
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
                {!isEditing && !showSettings && (
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium w-full"
                    >
                      <Edit2 className="w-4 h-4" /> Chỉnh sửa hồ sơ
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Info / Forms */}
              <div className="flex-1 w-full">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fullName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      {isEditingEmail ? (
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder={profile?.email}
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={handleUpdateEmail}
                            disabled={emailUpdating}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                          >
                            {emailUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingEmail(false);
                              setNewEmail("");
                            }}
                            disabled={emailUpdating}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={profile?.email || ""}
                            disabled
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-gray-100 text-gray-500"
                          />
                          <button
                            onClick={() => setIsEditingEmail(true)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Thay đổi
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={editForm.contactPhone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            contactPhone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        value={editForm.address?.street || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: {
                              ...editForm.address,
                              street: e.target.value,
                            },
                          })
                        }
                        placeholder="Số nhà, tên đường"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                      />
                      <input
                        type="text"
                        value={editForm.address?.city || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: {
                              ...editForm.address,
                              city: e.target.value,
                            },
                          })
                        }
                        placeholder="Thành phố / Tỉnh"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium"
                      >
                        <X className="w-4 h-4" /> Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mb-2">
                      {profile?.fullName || profile?.username}
                    </h1>
                    <p className="text-muted-foreground mb-2">
                      @{profile?.username}
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{profile?.email}</span>
                      </div>
                      {(profile?.address?.street || profile?.address?.city) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {[profile.address.street, profile.address.city]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          Tham gia{" "}
                          {new Date(profile?.createdAt).toLocaleDateString(
                            "vi-VN",
                            { month: "long", year: "numeric" }
                          )}
                        </span>
                      </div>
                    </div>
                    {profile?.contactPhone && (
                      <p className="text-sm text-muted-foreground">
                        SĐT: {profile.contactPhone}
                      </p>
                    )}
                    {profile?.dateOfBirth && (
                      <p className="text-sm text-muted-foreground">
                        Ngày sinh:{" "}
                        {new Date(profile.dateOfBirth).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Rating Card */}
              <div className="bg-muted rounded-lg p-4 text-center min-w-max">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(profile?.ratingSummary?.score || 0)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg font-bold">
                  {(profile?.ratingSummary?.score || 0).toFixed(1)} / 5.0
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.ratingSummary?.countPositive || 0} tích cực,{" "}
                  {profile?.ratingSummary?.countNegative || 0} tiêu cực
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-primary mb-1">
                {profile?.ratingSummary?.totalCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-green-600 mb-1">
                {profile?.ratingSummary?.countPositive || 0}
              </p>
              <p className="text-sm text-muted-foreground">Tích cực</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-red-600 mb-1">
                {profile?.ratingSummary?.countNegative || 0}
              </p>
              <p className="text-sm text-muted-foreground">Tiêu cực</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-primary mb-1">
                {profile?.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
              </p>
              <p className="text-sm text-muted-foreground">Trạng thái Email</p>
            </div>
          </div>

          <UpgradeRequest currentUser={profile} />
        </div>
      </div>
    </div>
  );
}
