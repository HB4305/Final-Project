import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import authService from "../../services/authService"; // Hãy chắc chắn đường dẫn đúng tới file service của bạn

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // BƯỚC 1: Gửi Email để lấy OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) return setError("Please enter your email");

    setLoading(true);
    try {
      // Gọi API: POST /auth/forgotpassword
      await authService.forgotPassword(email);
      setMessage("OTP has been sent to your email. Please check inbox/spam.");
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.msg ||
          "Failed to send OTP. Please check email address."
      );
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: Nhập OTP (Chỉ chuyển bước, chưa gọi API)
  const handleVerifyOtpInput = (e) => {
    e.preventDefault();
    setError("");

    // Vì backend API /resetpassword cần cả OTP và Password cùng lúc,
    // nên ở bước này ta chỉ kiểm tra độ dài rồi chuyển sang bước nhập pass.
    if (otp.length === 6) {
      setStep(3);
      setMessage("");
    } else {
      setError("Please enter a valid 6-digit OTP.");
    }
  };

  // BƯỚC 3: Nhập mật khẩu mới & Gọi API Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      // Gọi API: POST /auth/resetpassword
      // Payload cần khớp với backend: { email, otp, newPassword }
      await authService.resetPassword({
        email,
        otp,
        newPassword,
      });

      // Thành công -> Chuyển về trang login
      navigate("/auth/login");
      alert("Password reset successfully! Please login.");
    } catch (err) {
      console.error(err);
      // Nếu lỗi (OTP sai hoặc hết hạn), hiển thị lỗi.
      // Có thể user cần quay lại bước nhập OTP.
      setError(err.response?.data?.msg || "Failed to reset password.");
      if (err.response?.data?.msg === "Invalid OTP or expired") {
        // Tùy chọn: setStep(2) để nhập lại OTP
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-background border border-border rounded-lg p-8 shadow-sm">
          <Link
            to="/auth/signin"
            className="flex items-center gap-2 text-primary hover:underline mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
            <p className="text-muted-foreground">
              {step === 1 && "Enter your email to receive reset instructions"}
              {step === 2 && "Enter the 6-digit code sent to your email"}
              {step === 3 && "Create a new password for your account"}
            </p>
          </div>

          {/* Hiển thị thông báo thành công */}
          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500 text-green-600 rounded-lg text-sm mb-4">
              {message}
            </div>
          )}

          {/* Hiển thị lỗi */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 text-red-600 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* STEP 1: FORM EMAIL */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex justify-center items-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          )}

          {/* STEP 2: FORM OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtpInput} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-widest"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Check your email for the code
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Change Email?
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                disabled={otp.length !== 6}
              >
                Next
              </button>
            </form>
          )}

          {/* STEP 3: FORM NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Must be at least 6 characters
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || newPassword.length < 6}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 flex justify-center items-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
