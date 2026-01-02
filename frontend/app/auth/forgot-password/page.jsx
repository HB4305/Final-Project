import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import authService from "../../services/authService";
import Toast from "../../../components/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  // BƯỚC 1: Gửi Email để lấy OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email))
      return setToast({
        message: "Vui lòng nhập email hợp lệ",
        type: "error",
      });

    if (!recaptchaToken)
      return setToast({
        message: "Vui lòng xác minh bạn không phải là robot",
        type: "error",
      });

    setLoading(true);
    try {
      // Gọi API: POST /auth/forgotpassword
      await authService.forgotPassword(email);
      setToast({
        message:
          "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến hoặc spam.",
        type: "success",
      });
      setStep(2);
    } catch (err) {
      console.error(err);
      setToast({
        message:
          err.response?.data?.msg ||
          "Gửi OTP thất bại. Vui lòng kiểm tra lại địa chỉ email.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: Nhập OTP (Chỉ chuyển bước, chưa gọi API)
  const handleVerifyOtpInput = (e) => {
    e.preventDefault();

    // Vì backend API /resetpassword cần cả OTP và Password cùng lúc,
    // nên ở bước này ta chỉ kiểm tra độ dài rồi chuyển sang bước nhập pass.
    if (otp.length === 6) {
      setStep(3);
    } else {
      setToast({
        message: "Vui lòng nhập mã OTP 6 chữ số hợp lệ.",
        type: "error",
      });
    }
  };

  // BƯỚC 3: Nhập mật khẩu mới & Gọi API Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return setToast({
        message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số",
        type: "error",
      });
    }

    if (newPassword !== confirmPassword) {
      return setToast({
        message: "Mật khẩu xác nhận không khớp",
        type: "error",
      });
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
      setToast({
        message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.",
        type: "success",
      });
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      // Nếu lỗi (OTP sai hoặc hết hạn), hiển thị lỗi.
      // Có thể user cần quay lại bước nhập OTP.
      setToast({
        message: err.response?.data?.msg || "Đặt lại mật khẩu thất bại.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="w-full max-w-md">
        <div className="bg-background border border-border rounded-lg p-8 shadow-sm">
          <Link
            to="/auth/login"
            className="flex items-center gap-2 text-primary hover:underline mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Đặt lại Mật khẩu</h1>
            <p className="text-muted-foreground">
              {step === 1 &&
                "Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu"}
              {step === 2 && "Nhập mã 6 chữ số đã được gửi đến email của bạn"}
              {step === 3 && "Tạo mật khẩu mới cho tài khoản của bạn"}
            </p>
          </div>

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

              {/* ReCAPTCHA */}
              <div className="flex justify-center my-4">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
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
                  "Gửi mã đặt lại"
                )}
              </button>
            </form>
          )}

          {/* STEP 2: FORM OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtpInput} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nhập mã OTP
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest font-mono"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Kiểm tra email của bạn để lấy mã
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Đổi Email?
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                disabled={otp.length !== 6}
              >
                Tiếp tục
              </button>
            </form>
          )}

          {/* STEP 3: FORM NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mật khẩu mới
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
                  Phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading || newPassword.length < 8}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 flex justify-center items-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Đặt lại Mật khẩu"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
