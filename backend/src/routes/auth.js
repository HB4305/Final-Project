// ROUTES: Authentication Routes

import express from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
  updateProfile,
  updateEmail,
  verifyEmailOtp,
  requestChangePassword,
  confirmChangePassword,
} from "../controllers/auth.js";
import { authenticate } from "../middlewares/auth.js";
import {
  validateRegisterInput,
  validateLoginInput,
  validateOtpInput,
} from "../middlewares/validation.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới (gửi OTP)
 */
router.post("/register", validateRegisterInput, register);

/**
 * POST /api/auth/verify-otp
 * Xác thực OTP để hoàn tất đăng ký
 */
router.post("/verify-otp", validateOtpInput, verifyOtp);

/**
 * POST /api/auth/login
 * Đăng nhập
 */
router.post("/login", validateLoginInput, login);

/**
 * POST /api/auth/logout
 * Đăng xuất
 */
router.post("/logout", authenticate, logout);

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu
 */
router.post("/change-password", authenticate, changePassword);

/**
 * POST /api/auth/change-password-request
 * Yêu cầu đổi mật khẩu (Gửi OTP)
 */
router.post("/change-password-request", authenticate, requestChangePassword);

/**
 * POST /api/auth/change-password-confirm
 * Xác nhận đổi mật khẩu (Verify OTP)
 */
router.post("/change-password-confirm", authenticate, confirmChangePassword);

/**
 * PUT /api/auth/profile
 * Cập nhật thông tin cá nhân
 */
router.put("/profile", authenticate, updateProfile);

/**
 * PUT /api/auth/email
 * Cập nhật email (cần verify lại)
 */
router.put("/email", authenticate, updateEmail);

/**
 * POST /api/auth/verify-email-otp
 * Xác thực OTP cho email mới
 */
router.post("/verify-email-otp", authenticate, verifyEmailOtp);

/**
 * POST /api/auth/forgot-password
 * Quên mật khẩu (Gửi OTP)
 */
router.post("/forgot-password", forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset mật khẩu với OTP
 */
router.post("/reset-password", resetPassword);

// ========================================
// Social Authentication Routes (Google OAuth)
// ========================================

/**
 * GET /api/auth/google
 * Redirect to Google for authentication
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * GET /api/auth/google/callback
 * Google callback URL
 */
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate(
      "google",
      { session: false },
      async (err, user, info) => {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        if (err) {
          console.error("Google auth error:", err);
          if (err.message === "email_exists_use_password") {
            return res.redirect(
              `${frontendUrl}/auth/login?error=email_exists_use_password`
            );
          }
          return res.redirect(`${frontendUrl}/auth/login?error=auth_failed`);
        }

        if (!user) {
          return res.redirect(`${frontendUrl}/auth/login?error=auth_failed`);
        }

        try {
          // Generate tokens for the authenticated user
          const { generateAccessToken, generateRefreshToken } = await import(
            "../utils/jwt.js"
          );

          // Convert Mongoose document to plain object for JWT
          const userPayload = {
            _id: user._id,
            email: user.email,
            username: user.username,
            roles: user.roles,
          };

          const accessToken = generateAccessToken(userPayload);
          const refreshToken = generateRefreshToken(userPayload);

          // Set cookies
          res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });

          // Redirect to frontend home with token
          res.redirect(`${frontendUrl}/?token=${accessToken}`);
        } catch (error) {
          console.error("Google auth callback processing error:", error);
          res.redirect(`${frontendUrl}/auth/login?error=auth_failed`);
        }
      }
    )(req, res, next);
  }
);

export default router;
