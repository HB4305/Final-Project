import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, Gavel } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import Toast from "../../../components/Toast";
import authService from "../../services/authService";
import AddressSelector from "../../../components/address-selector";

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1: Register Form, 2: OTP Form
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    address: {
        city: "",
        district: "",
        ward: "",
        street: ""
    },
    email: "",
    password: "",
    confirmPassword: "",
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
    if (!formData.address.city || !formData.address.ward || !formData.address.street) {
        newErrors.address = "Vui lòng nhập đầy đủ địa chỉ";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email))
      newErrors.email = "Email không hợp lệ";

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password))
      newErrors.password =
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Mật khẩu không khớp";

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
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await authService.signup({
        username: formData.username,
        address: formData.address,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        recaptchaToken: recaptchaToken,
      });

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

      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }

      console.error("[SIGNUP] Error:", err.response?.data || err.message);

      if (err.response && err.response.data) {
        if (err.response.data.message) {
          setErrors({ general: err.response.data.message });
        }
        else if (err.response.data.errors) {
          const apiErrors = {};
          err.response.data.errors.forEach((error) => {
            if (error.path) apiErrors[error.path] = error.msg;
            else if (error.param) apiErrors[error.param] = error.msg;
            else apiErrors.general = error.msg;
          });
          setErrors(apiErrors);
        }
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
       {/* Background decoration */}
       <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>

        <div className="glass-card bg-[#1e293b]/40 rounded-2xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
          {/* HEADER */}
          <div className="flex justify-center mb-8">
               <Link to="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-300 border border-white/10">
                    <Gavel className="w-6 h-6 fill-white/20" />
                </div>
                <span className="font-extrabold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 tracking-tight drop-shadow-sm">
                    AuctionHub
                </span>
                </Link>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? "Tạo tài khoản mới" : "Xác thực Email"}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 ? "Bắt đầu hành trình đấu giá của bạn" : "Nhập mã OTP vừa được gửi đến email của bạn"}
            </p>
          </div>

          {/* HIỂN THỊ LỖI CHUNG */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl text-sm font-medium animate-pulse">
              {errors.general}
            </div>
          )}

          {/* --- VIEW 1: SIGNUP FORM --- */}
          {step === 1 && (
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="nguyenvana"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all ${
                      errors.username ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.username && (
                    <p className="text-xs text-red-400 mt-1">{errors.username}</p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all ${
                      errors.fullName ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@vidu.com"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all ${
                    errors.email ? "border-red-500/50" : "border-white/10"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Address */}
              {/* Address Selector */}
              <div className="space-y-2">
                <AddressSelector 
                    value={formData.address} 
                    onChange={(newAddress) => setFormData({...formData, address: newAddress})}
                    disabled={isLoading}
                />
                
                {/* Error handling for address fields */}
                {(errors.address || errors['address.city'] || errors['address.ward']) && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.address || "Vui lòng hoàn thành địa chỉ (Tỉnh/Thành phố, Phường/Xã)"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all pr-10 ${
                        errors.password ? "border-red-500/50" : "border-white/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all ${
                      errors.confirmPassword ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* ReCAPTCHA */}
              <div className="flex justify-center my-4">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} // Nhớ cấu hình trong .env frontend
                  onChange={onRecaptchaChange}
                  theme="dark"
                  hl="vi"
                />
              </div>
              {errors.recaptcha && (
                <p className="text-xs text-red-400 text-center">
                  {errors.recaptcha}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 focus:ring-4 focus:ring-primary/20 transition transform hover:-translate-y-1 active:scale-[0.98] font-bold flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                {isLoading ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
              </button>
            </form>
          )}

          {/* --- VIEW 2: OTP VERIFICATION --- */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
              <div className="text-center text-sm text-gray-300 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                Chúng tôi đã gửi mã xác thực đến <br />
                <span className="font-bold text-primary block mt-1 text-base">
                  {formData.email}
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-center text-gray-300 mb-2">
                  NHẬP MÃ OTP
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Chỉ cho nhập số
                  placeholder="000000"
                  className={`w-full px-4 py-4 text-center text-3xl tracking-[1em] font-mono bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white transition-all ${
                    errors.otp ? "border-red-500/50" : "border-white/10"
                  }`}
                />
                {errors.otp && (
                  <p className="text-xs text-red-400 mt-2 text-center">
                    {errors.otp}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-bold flex justify-center items-center gap-2 shadow-lg shadow-green-600/20"
              >
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-5 h-5" />}
                {isLoading ? "Đang xác thực..." : "Xác thực tài khoản"}
              </button>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 mx-auto transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại bước đăng ký
                </button>
              </div>
            </form>
          )}

          {/* FOOTER LINK (Chỉ hiện khi ở step 1) */}
          {step === 1 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-gray-400">
                Đã có tài khoản?{" "}
                <Link
                  to="/auth/login"
                  className="text-primary hover:text-primary/80 font-bold transition"
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
