import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

import authService from "../../services/authService";

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1: Register Form, 2: OTP Form
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  // State cho OTP
  const [otp, setOtp] = useState("");

  // State cho reCaptcha
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // --- VALIDATION ---
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Valid email is required";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.agreeTerms)
      newErrors.agreeTerms = "You must agree to the terms";

    // Validate reCaptcha
    if (!recaptchaToken)
      newErrors.recaptcha = "Please verify you are not a robot";

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

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Gửi data kèm recaptchaToken xuống backend
      await authService.signup({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        recaptchaToken: recaptchaToken,
      });

      // Thành công -> Chuyển sang bước nhập OTP
      setIsLoading(false);
      setStep(2);
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data && err.response.data.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach((error) => {
          // Xử lý lỗi trả về từ express-validator
          if (error.path)
            apiErrors[error.path] = error.msg; // express-validator v7
          else if (error.param) apiErrors[error.param] = error.msg; // cũ
          else apiErrors.general = error.msg;
        });
        setErrors(apiErrors);
      } else {
        setErrors({
          general: err.response?.data?.msg || "An unexpected error occurred.",
        });
      }
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
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
      alert("Account verified successfully! Please login.");
      navigate("/auth/login");
    } catch (err) {
      setIsLoading(false);
      setErrors({ otp: err.response?.data?.msg || "Verification failed" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-background border border-border rounded-lg p-8 shadow-sm">
          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">AuctionHub</h1>
            <p className="text-muted-foreground">
              {step === 1 ? "Create your account" : "Verify your email"}
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
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.fullName ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
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
                  Password
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
                  Confirm Password
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
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="text-xs text-red-500">{errors.agreeTerms}</p>
              )}

              {/* ReCAPTCHA */}
              <div className="flex justify-center my-4">
                <ReCAPTCHA
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
                {isLoading ? "Processing..." : "Sign Up"}
              </button>
            </form>
          )}

          {/* --- VIEW 2: OTP VERIFICATION --- */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                We have sent a verification code to <br />
                <span className="font-semibold text-foreground">
                  {formData.email}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter OTP
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
                {isLoading ? "Verifying..." : "Verify Account"}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Wrong email? Go back
                </button>
              </div>
            </form>
          )}

          {/* FOOTER LINK (Chỉ hiện khi ở step 1) */}
          {step === 1 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
