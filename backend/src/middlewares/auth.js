// MIDDLEWARE: Xác thực JWT và quản lý session

import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
} from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";
import { ERROR_CODES } from "../lib/constants.js";

/**
 * Middleware xác thực token từ header hoặc cookie
 * Gán thông tin user vào req.user nếu token hợp lệ
 */
export const authenticate = (req, res, next) => {
  try {
    // Lấy token từ header Authorization, x-auth-token, hoặc cookie
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.headers["x-auth-token"] ||
      req.cookies.accessToken;

    if (!token) {
      return next(
        new AppError("Please login to continue", 401, ERROR_CODES.UNAUTHORIZED)
      );
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(
        new AppError(
          "Invalid or expired token",
          401,
          ERROR_CODES.UNAUTHORIZED
        )
      );
    }

    // Gán thông tin user vào request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Authentication error:", error);
    next(error);
  }
};

/**
 * Middleware kiểm tra refresh token để cấp lại access token
 */
export const refreshAccessToken = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return next(
        new AppError(
          "Refresh token không tồn tại",
          401,
          ERROR_CODES.UNAUTHORIZED
        )
      );
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return next(
        new AppError(
          "Refresh token không hợp lệ hoặc đã hết hạn",
          401,
          ERROR_CODES.UNAUTHORIZED
        )
      );
    }

    // Cấp token access mới
    const newAccessToken = generateAccessToken({
      _id: decoded._id,
      email: decoded.email,
      username: decoded.username,
      roles: decoded.roles,
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.user = decoded;
    next();
  } catch (error) {
    console.error("[REFRESH TOKEN MIDDLEWARE] Lỗi refresh token:", error);
    next(error);
  }
};

/**
 * Middleware logout: xoá cookies
 */
export const logout = (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    next();
  } catch (error) {
    console.error("[LOGOUT MIDDLEWARE] Lỗi logout:", error);
    next(error);
  }
};
