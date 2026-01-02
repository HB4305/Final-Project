import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft, Gavel } from "lucide-react";
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
      const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

      setToast({
        message: `Đăng nhập thành công! ${isAdmin ? "Đang chuyển hướng quản trị..." : "Đang chuyển hướng..."}`,
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
        errorMessage = err.response.data.message || err.response.data.msg || errorMessage;
      }

      if (errorMessage === "Invalid credentials" || errorMessage === "Email hoặc mật khẩu không chính xác")
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
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
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
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition">
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
          
          <div className="glass-card bg-[#1e293b]/40 rounded-2xl p-8 md:p-10 border border-white/10 shadow-2xl">
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
              <h1 className="text-2xl font-bold text-white mb-2">Chào mừng trở lại!</h1>
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
                <label className="text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-sm font-medium text-gray-300">Mật khẩu</label>
                   <Link to="/auth/forgot-password" className="text-xs text-primary hover:text-primary/80 transition font-medium">
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                  theme="dark"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 focus:ring-4 focus:ring-primary/20 transition transform hover:-translate-y-1 active:scale-[0.98] font-bold flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
                  <span className="px-2 bg-[#0f172a] text-muted-foreground rounded">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>

              <a
                href={`${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/auth/google`}
                className="flex items-center justify-center px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all font-medium gap-2 w-full"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                Google
              </a>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              Chưa có tài khoản?{" "}
              <Link to="/auth/signup" className="text-primary hover:text-primary/80 font-bold transition">
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
