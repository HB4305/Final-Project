import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../../components/Toast";

export default function LoginPage() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  // Check for error query param (from OAuth)
  React.useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_failed") {
      setToast({
        message: "Đăng nhập Google thất bại. Vui lòng thử lại.",
        type: "error",
      });
    } else if (errorParam === "auth_failed") {
      setToast({
        message: "Xác thực thất bại. Vui lòng thử lại.",
        type: "error",
      });
    } else if (errorParam === "email_exists_use_password") {
      setToast({
        message: "Email này đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu.",
        type: "error",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!recaptchaToken) {
      setError("Vui lòng xác minh bạn không phải là robot");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await login(email, password);
      setIsLoading(false);

      const user = response.data.data.user;
      const isAdmin =
        user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

      setToast({
        message: `Đăng nhập thành công! ${
          isAdmin ? "Đang chuyển hướng quản trị..." : "Đang chuyển hướng..."
        }`,
        type: "success",
      });

      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      let errorMessage = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.";

      if (err.response && err.response.data && err.response.data.errors) {
        errorMessage = err.response.data.errors[0].msg;
      } else if (err.response && err.response.data) {
        errorMessage =
          err.response.data.message || err.response.data.msg || errorMessage;
      }

      if (
        errorMessage === "Invalid credentials" ||
        errorMessage === "Email hoặc mật khẩu không chính xác"
      )
        errorMessage = "Email hoặc mật khẩu không đúng.";

      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px]" />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>

          <div className="glass rounded-2xl p-8 md:p-10 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 mb-2">
                Chào mừng trở lại!
              </h1>
              <p className="text-muted-foreground">
                Đăng nhập để tiếp tục phiên đấu giá
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl text-sm font-medium animate-pulse">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@vidu.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-300">
                    Mật khẩu
                  </label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 transition font-medium"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                  theme="dark"
                  hl="vi"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 flex justify-center items-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                {isLoading ? "Đang xử lý..." : "Đăng nhập ngay"}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-[#1a1a2e] text-muted-foreground rounded">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>

              <a
                href={`${
                  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
                }/auth/google`}
                className="flex items-center justify-center px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all font-medium gap-2 w-full"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </a>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              Chưa có tài khoản?{" "}
              <Link
                to="/auth/signup"
                className="text-primary hover:text-primary/80 font-bold transition"
              >
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
