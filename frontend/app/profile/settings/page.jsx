import React, { useState, useEffect } from "react";
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Navigation from "../../../components/navigation";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bidNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
    privateProfile: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Check if user is Google login (no password)
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Password visibility toggles
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Check if user logged in with Google
  useEffect(() => {
    const checkAuthMethod = async () => {
      try {
        // First try from currentUser context
        if (currentUser?.socialIds?.googleId || currentUser?.googleId) {
          console.log(
            "[Settings] User is Google user from context:",
            currentUser
          );
          setIsGoogleUser(true);
          setCheckingAuth(false);
          return;
        }

        // Fallback to API call
        const res = await userService.getUserProfile();
        const user = res.data?.data?.user;
        console.log("[Settings] User from API:", user);
        // Check both socialIds.googleId and googleId for compatibility
        const hasGoogleId = !!(user?.socialIds?.googleId || user?.googleId);
        console.log("[Settings] Has Google ID:", hasGoogleId);
        setIsGoogleUser(hasGoogleId);
      } catch (err) {
        console.error("Error checking auth method:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuthMethod();
  }, [currentUser]);

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // For Google users setting password for first time
    if (isGoogleUser && isSettingPassword) {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        setError("Vui lòng nhập và xác nhận mật khẩu mới");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("Mật khẩu không khớp");
        return;
      }

      try {
        setLoading(true);
        // Call API to set password for Google user (need to create this endpoint)
        const res = await userService.changePassword({
          oldPassword: "", // Empty for Google users
          newPassword: passwordForm.newPassword,
        });

        if (res.data?.status === "success") {
          setMessage(
            "Thiết lập mật khẩu thành công! Bạn có thể đăng nhập bằng email và mật khẩu."
          );
          setIsGoogleUser(false);
          setIsSettingPassword(false);
          setPasswordForm({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setTimeout(() => setMessage(""), 5000);
        }
      } catch (err) {
        console.error("Error setting password:", err);
        setError(err.response?.data?.message || "Thiết lập mật khẩu thất bại");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal password change
    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }

    try {
      setLoading(true);
      const res = await userService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.status === "success") {
        setMessage("Cập nhật mật khẩu thành công!");
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.response?.data?.message || "Cập nhật mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Cài đặt tài khoản</h1>
          <p className="text-muted-foreground mb-8">
            Quản lý bảo mật và tùy chọn của bạn
          </p>

          {/* Success/Error Messages */}
          {message && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500 text-green-600 rounded-lg flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-5 h-5" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 text-red-600 rounded-lg flex items-center gap-2 animate-in fade-in">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Password Section - Hidden for Google users */}
          {!isGoogleUser && (
            <div className="bg-background border border-border rounded-lg p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">
                  {isGoogleUser && !isSettingPassword
                    ? "Thiết lập mật khẩu"
                    : "Đổi mật khẩu"}
                </h2>
              </div>

              {/* Google User Notice */}
              {isGoogleUser && !isSettingPassword ? (
                <div className="mb-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 mb-2">
                      🔐 Bạn đang đăng nhập bằng Google. Bạn chưa có mật khẩu.
                    </p>
                    <p className="text-xs text-blue-600">
                      Thiết lập mật khẩu để đăng nhập bằng email/mật khẩu thay
                      vì Google.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingPassword(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                  >
                    Thiết lập mật khẩu
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-6">
                    {isGoogleUser
                      ? "Tạo mật khẩu cho tài khoản của bạn"
                      : "Cập nhật mật khẩu để bảo vệ tài khoản của bạn"}
                  </p>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {!isGoogleUser && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Mật khẩu hiện tại *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.old ? "text" : "password"}
                            name="oldPassword"
                            value={passwordForm.oldPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                old: !showPasswords.old,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                          >
                            {showPasswords.old ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Mật khẩu mới *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {passwordForm.newPassword &&
                        passwordForm.newPassword.length < 6 && (
                          <p className="text-xs text-red-500 mt-1">
                            Mật khẩu phải có ít nhất 6 ký tự
                          </p>
                        )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Xác nhận mật khẩu mới *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Xác nhận mật khẩu mới"
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {passwordForm.confirmPassword &&
                        passwordForm.newPassword !==
                          passwordForm.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            Mật khẩu không khớp
                          </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {isGoogleUser
                              ? "Đang thiết lập..."
                              : "Đang cập nhật..."}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            {isGoogleUser
                              ? "Thiết lập mật khẩu"
                              : "Cập nhật mật khẩu"}
                          </>
                        )}
                      </button>
                      {isGoogleUser && isSettingPassword && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingPassword(false);
                            setPasswordForm({
                              oldPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                          }}
                          disabled={loading}
                          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium disabled:opacity-50"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Google User Info */}
          {isGoogleUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-blue-900">
                  Bảo mật tài khoản
                </h2>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                🔐 Tài khoản của bạn được bảo vệ bởi Google Sign-In
              </p>
              <p className="text-xs text-blue-600">
                Quản lý mật khẩu không khả dụng cho tài khoản Google. Bảo mật
                tài khoản của bạn được quản lý bởi Google.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
