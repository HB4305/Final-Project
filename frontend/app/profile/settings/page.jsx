import React, { useState, useEffect } from "react";
import { Lock, Loader2, Eye, EyeOff, CheckCircle, X, Shield, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "../../../components/navigation";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../../components/Toast";

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bidNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
    privateProfile: false,
  });

  const [toast, setToast] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // OTP States
  const [step, setStep] = useState(1); // 1: Input Passwords, 2: Input OTP
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);

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
        if (currentUser?.socialIds?.googleId || currentUser?.googleId) {
          setIsGoogleUser(true);
          setCheckingAuth(false);
          return;
        }

        const res = await userService.getUserProfile();
        const user = res.data?.data?.user;
        const hasGoogleId = !!(user?.socialIds?.googleId || user?.googleId);
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

    if (isGoogleUser && isSettingPassword) {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        setToast({
          message: "Vui lòng nhập và xác nhận mật khẩu mới",
          type: "error",
        });
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setToast({
          message: "Mật khẩu phải có ít nhất 6 ký tự",
          type: "error",
        });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setToast({ message: "Mật khẩu không khớp", type: "error" });
        return;
      }

      try {
        setLoading(true);
        const res = await userService.changePassword({
          oldPassword: "", 
          newPassword: passwordForm.newPassword,
        });

        if (res.data?.status === "success") {
          setToast({
            message:
              "Thiết lập mật khẩu thành công! Bạn có thể đăng nhập bằng email và mật khẩu.",
            type: "success",
          });
          setIsGoogleUser(false);
          setIsSettingPassword(false);
          setPasswordForm({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      } catch (err) {
        console.error("Error setting password:", err);
        setToast({
          message: err.response?.data?.message || "Thiết lập mật khẩu thất bại",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setToast({ message: "Vui lòng điền đầy đủ thông tin", type: "error" });
      return;
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setToast({
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
        type: "error",
      });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setToast({
        message:
          "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số",
        type: "error",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: "Mật khẩu mới không khớp", type: "error" });
      return;
    }

    try {
      setLoading(true);
      await userService.requestChangePassword(passwordForm.oldPassword);
      setToast({
        message: "Mã OTP đã được gửi đến email của bạn.",
        type: "success",
      });
      setStep(2);
    } catch (err) {
      console.error("Error requesting password change:", err);
      setToast({
        message:
          err.response?.data?.message || "Không thể gửi yêu cầu đổi mật khẩu",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasswordOtp = async () => {
    if (otp.length !== 6) {
      setToast({ message: "Vui lòng nhập mã OTP 6 chữ số", type: "error" });
      return;
    }

    try {
      setOtpLoading(true);
      const res = await userService.confirmChangePassword(
        otp,
        passwordForm.newPassword
      );

      if (res.data?.status === "success") {
        setToast({ message: "Cập nhật mật khẩu thành công!", type: "success" });
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setOtp("");
        setStep(1);
      }
    } catch (err) {
      console.error("Error confirming password change:", err);
      setToast({
        message: err.response?.data?.message || "Đổi mật khẩu thất bại",
        type: "error",
      });
    } finally {
      setOtpLoading(false);
    }
  };

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
      <div className="pt-24 pb-12 max-w-3xl mx-auto px-4">
        <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition">
            <ChevronLeft className="w-4 h-4" /> Quay lại hồ sơ
        </Link>

        <div className="mb-8">
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-2">
                Cài đặt & Bảo mật
            </h1>
            <p className="text-muted-foreground">
                Quản lý mật khẩu và các tùy chọn bảo mật cho tài khoản của bạn
            </p>
        </div>

        <div className="space-y-6">
             {/* Security Section */}
             <div className="glass p-8 rounded-2xl border border-white/20 bg-[#1e293b]/60 shadow-2xl animate-slide-up">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                         <Shield className="w-6 h-6" />
                    </div>
                    <div>
                         <h2 className="text-xl font-bold">Bảo mật tài khoản</h2>
                         <p className="text-sm text-muted-foreground">Đổi mật khẩu và xác thực</p>
                    </div>
                 </div>

                 {/* Google User Notice */}
                {isGoogleUser && !isSettingPassword ? (
                    <div className="relative overflow-hidden rounded-2xl p-1 bg-gradient-to-r from-blue-500/50 to-cyan-500/50">
                        <div className="relative bg-[#1e293b] rounded-xl p-6 h-full">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                                     <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                                     </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                                        Đăng nhập bằng Google
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        Tài khoản được bảo mật và liên kết trực tiếp với Google.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                         {!isGoogleUser && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Mật khẩu hiện tại</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.old ? "text" : "password"}
                                        name="oldPassword"
                                        value={passwordForm.oldPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition p-12 pr-12 text-white placeholder-gray-500"
                                    />
                                     <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition"
                                    >
                                        {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                         )}

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition pr-12 text-white placeholder-gray-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition"
                                    >
                                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition pr-12 text-white placeholder-gray-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                         </div>
                         
                        <div className="flex items-center gap-3 pt-2">
                             <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 font-medium flex items-center gap-2 disabled:opacity-50"
                             >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                {isGoogleUser ? "Thiết lập mật khẩu" : "Đổi mật khẩu"}
                             </button>
                             {isGoogleUser && isSettingPassword && (
                                 <button
                                    type="button"
                                    onClick={() => setIsSettingPassword(false)}
                                    className="px-6 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition font-medium"
                                >
                                    Hủy
                                </button>
                             )}
                        </div>

                    </form>
                )}
             </div>
        </div>

      </div>

      {/* OTP Verification Modal for Password Change */}
      {step === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Xác thực đổi mật khẩu
              </h3>
              <button
                onClick={() => {
                  setStep(1);
                  setOtp("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-6 text-center">
                Mã xác thực đã được gửi đến email của bạn.<br/>
                Vui lòng kiểm tra hộp thư đến.
              </p>

              <div className="space-y-6">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 border-2 border-primary/20 rounded-xl bg-primary/5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-center text-3xl tracking-[0.5em] font-mono font-bold text-primary placeholder-primary/30 transition-all"
                  autoFocus
                />

                <button
                  onClick={handleVerifyPasswordOtp}
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    "Xác nhận thay đổi"
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
