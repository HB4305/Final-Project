import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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

      // Get user data from response
      const user = response.data.data.user;

      // Check if user is admin or superadmin
      const isAdmin =
        user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

      setToast({
        message: `Đăng nhập thành công! ${
          isAdmin
            ? "Đang chuyển hướng đến trang quản trị..."
            : "Đang chuyển hướng..."
        }`,
        type: "success",
      });

      // Redirect based on user role
      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      // Xử lý lỗi trả về từ backend (auth.js)
      let errorMessage = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.";

      if (err.response && err.response.data && err.response.data.errors) {
        // Lỗi từ express-validator (dạng mảng)
        errorMessage = err.response.data.errors[0].msg;
      } else if (err.response && err.response.data && err.response.data.msg) {
        // Lỗi logic khác (ví dụ: chưa verify email)
        errorMessage = err.response.data.msg;
      }

      // Dịch một số lỗi phổ biến từ backend nếu cần
      if (
        errorMessage === "Invalid credentials" ||
        errorMessage === "Email hoặc mật khẩu không chính xác"
      )
        errorMessage = "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.";
      if (errorMessage === "User not found")
        errorMessage = "Tài khoản không tồn tại";
      if (errorMessage === "Please verify your email first")
        errorMessage = "Vui lòng xác thực email trước khi đăng nhập";

      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">AuctionHub</h1>
            <p className="text-muted-foreground">
              Đăng nhập vào tài khoản của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hiển thị lỗi */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary pr-10"
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <Link
                to="/auth/forgot-password"
                className="text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* ReCAPTCHA */}
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
              />
            </div>
            {error && error.includes("robot") && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex justify-center items-center"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : null}
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Social Auth */}
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <a
                href={`${
                  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
                }/auth/google`}
                className="flex items-center justify-center px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5 mr-2"
                />
                <span className="text-sm font-medium">Google</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                to="/auth/signup"
                className="text-primary hover:underline font-medium"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
