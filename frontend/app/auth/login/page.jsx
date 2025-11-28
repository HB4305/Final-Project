import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Thêm icon Loader2 cho đẹp

import authService from "../../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await authService.signin({ email, password });

      // Lưu token vào localStorage
      localStorage.setItem("token", res.data.token);

      setIsLoading(false);
      // Chuyển hướng về trang chủ
      navigate("/");
    } catch (err) {
      setIsLoading(false);
      // Xử lý lỗi trả về từ backend (auth.js)
      if (err.response && err.response.data && err.response.data.errors) {
        // Lỗi từ express-validator (dạng mảng)
        setError(err.response.data.errors[0].msg);
      } else if (err.response && err.response.data && err.response.data.msg) {
        // Lỗi logic khác (ví dụ: chưa verify email)
        setError(err.response.data.msg);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-background border border-border rounded-lg p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">AuctionHub</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
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
              <label className="block text-sm font-medium mb-2">Password</label>
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
                <span>Remember me</span>
              </label>

              {/* --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY --- */}
              {/* Đổi từ button sang Link để trỏ tới trang Forgot Password */}
              <Link
                to="/auth/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex justify-center items-center"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : null}
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Social Auth (Giữ nguyên UI, chưa có logic backend) */}
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium text-sm"
              >
                Google
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium text-sm"
              >
                Facebook
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
