import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import Toast from "../../../components/Toast";
import authService from "../../services/authService";

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1: Register Form, 2: OTP Form
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  // State cho OTP
  const [otp, setOtp] = useState("");

  // State cho reCaptcha
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // --- VALIDATION ---
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim())
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    if (formData.username.length < 3 || formData.username.length > 30)
      newErrors.username = "Tên đăng nhập phải từ 3-30 ký tự";
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!formData.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Email không hợp lệ";
    if (formData.password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Mật khẩu không khớp";
    if (!formData.agreeTerms)
      newErrors.agreeTerms = "Bạn phải đồng ý với điều khoản sử dụng";

    // Validate reCaptcha
    if (!recaptchaToken)
      newErrors.recaptcha = "Vui lòng xác minh bạn không phải là robot";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    if (errors.recaptcha) {
      setErrors((prev) => ({ ...prev, recaptcha: null }));
    }
  };

  // --- STEP 1: SUBMIT REGISTRATION ---
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Reset reCAPTCHA if validation fails
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log("[SIGNUP] Sending data:", {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        hasPassword: !!formData.password,
        hasRecaptcha: !!recaptchaToken,
      });

      // Gửi data kèm recaptchaToken xuống backend
      await authService.signup({
        username: formData.username,
        address: formData.address,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        recaptchaToken: recaptchaToken,
      });

      // Thành công -> Chuyển sang bước nhập OTP
      setIsLoading(false);
      setToast({
        message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.",
        type: "success",
      });
      setTimeout(() => {
        setToast(null);
        setStep(2);
      }, 2000);
    } catch (err) {
      setIsLoading(false);

      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }

      console.error("[SIGNUP] Error:", err.response?.data || err.message);

      if (err.response && err.response.data) {
        // Check for direct message
        if (err.response.data.message) {
          setErrors({ general: err.response.data.message });
        }
        // Check for errors array (express-validator)
        else if (err.response.data.errors) {
          const apiErrors = {};
          err.response.data.errors.forEach((error) => {
            if (error.path) apiErrors[error.path] = error.msg;
            else if (error.param) apiErrors[error.param] = error.msg;
            else apiErrors.general = error.msg;
          });
          setErrors(apiErrors);
        }
        // Fallback
        else {
          setErrors({
            general:
              err.response?.data?.msg || JSON.stringify(err.response.data),
          });
        }
      } else {
        setErrors({
          general: "Đã xảy ra lỗi không mong muốn.",
        });
      }
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setErrors({ otp: "Vui lòng nhập mã OTP 6 chữ số hợp lệ" });
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp({
        email: formData.email,
        otp: otp,
      });

      setIsLoading(false);
      // OTP đúng -> Chuyển hướng sang trang Login
      setToast({
        message: "Xác thực tài khoản thành công! Vui lòng đăng nhập.",
        type: "success",
      });
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.msg || "Xác thực thất bại";
      setErrors({ otp: errorMsg });
      setToast({ message: errorMsg, type: "error" });
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
          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">AuctionHub</h1>
            <p className="text-muted-foreground">
              {step === 1 ? "Tạo tài khoản mới" : "Xác thực email"}
            </p>
          </div>

          {/* HIỂN THỊ LỖI CHUNG */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-600 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* --- VIEW 1: SIGNUP FORM --- */}
          {step === 1 && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className={`w-full px-4 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.username ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.username && (
                  <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className={`w-full px-4 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.fullName ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  className={`w-full px-4 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.address ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.email ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition pr-10 ${
                      errors.password ? "border-red-500" : "border-border"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.confirmPassword ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-1 rounded border-border focus:ring-2 focus:ring-primary"
                />
                <label className="text-sm text-muted-foreground">
                  Tôi đồng ý với{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                  >
                    Điều khoản sử dụng
                  </button>{" "}
                  và{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                  >
                    Chính sách bảo mật
                  </button>
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="text-xs text-red-500">{errors.agreeTerms}</p>
              )}

              {/* ReCAPTCHA */}
              <div className="flex justify-center my-4">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} // Nhớ cấu hình trong .env frontend
                  onChange={onRecaptchaChange}
                />
              </div>
              {errors.recaptcha && (
                <p className="text-xs text-red-500 text-center">
                  {errors.recaptcha}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex justify-center items-center"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </form>
          )}

          {/* --- VIEW 2: OTP VERIFICATION --- */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Chúng tôi đã gửi mã xác thực đến <br />
                <span className="font-semibold text-foreground">
                  {formData.email}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nhập mã OTP
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Chỉ cho nhập số
                  placeholder="000000"
                  className={`w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.otp ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.otp && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {errors.otp}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium flex justify-center items-center"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? "Đang xác thực..." : "Xác thực tài khoản"}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Sai email? Quay lại
                </button>
              </div>
            </form>
          )}

          {/* FOOTER LINK (Chỉ hiện khi ở step 1) */}
          {step === 1 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link
                  to="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
