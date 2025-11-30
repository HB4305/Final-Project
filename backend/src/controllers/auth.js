import axios from "axios";
import { authService } from "../services/AuthService.js";
import { AppError } from "../utils/errors.js";

/**
 * Controller đăng ký tài khoản mới (Step 1: Gửi thông tin và nhận OTP)
 * Yêu cầu có RECAPTCHA_SECRET_KEY trong file .env
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, recaptchaToken } = req.body;

    // 1. Xác thực reCaptcha
    if (!recaptchaToken) {
      throw new AppError("Vui lòng xác thực reCaptcha.", 400);
    }

    // NOTE: Cần có biến RECAPTCHA_SECRET_KEY trong file .env
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      console.error(
        "RECAPTCHA_SECRET_KEY is not set in environment variables."
      );
      throw new AppError("Lỗi hệ thống, không thể xác thực reCaptcha.", 500);
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

    const { data: recaptchaResult } = await axios.post(verifyUrl);

    if (!recaptchaResult.success) {
      throw new AppError("Xác thực reCaptcha thất bại.", 400);
    }

    // 2. Gọi service để đăng ký và gửi OTP
    const result = await authService.register({
      username,
      email,
      password,
      fullName,
    });

    res.status(201).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller xác thực OTP (Step 2: Kích hoạt tài khoản)
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOtp({ email, otp });

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller đăng nhập
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    // Gán tokens vào cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: "success",
      message: "Đăng nhập thành công",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller logout
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      status: "success",
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy thông tin user hiện tại
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // Handle both _id and id from different login methods
    const userId = req.user._id || req.user.id;
    const user = await authService.getUserInfo(userId);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller đổi mật khẩu
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword(req.user._id, {
      oldPassword,
      newPassword,
    });

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller quên mật khẩu (Gửi OTP)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller reset mật khẩu với OTP
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await authService.resetPasswordWithOtp({
      email,
      otp,
      newPassword,
    });

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller cập nhật thông tin cá nhân
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, dateOfBirth, contactPhone, address, profileImageUrl } =
      req.body;

    const user = await authService.updateProfile(req.user._id, {
      fullName,
      dateOfBirth,
      contactPhone,
      address,
      profileImageUrl,
    });

    res.status(200).json({
      status: "success",
      message: "Cập nhật thông tin thành công",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller cập nhật email
 */
export const updateEmail = async (req, res, next) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      throw new AppError("Vui lòng cung cấp email mới", 400);
    }

    const result = await authService.updateEmail(req.user._id, newEmail);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: { email: result.email },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller xác thực OTP cho email mới
 */
export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;

    console.log("[VERIFY EMAIL OTP CONTROLLER] Request body:", req.body);
    console.log("[VERIFY EMAIL OTP CONTROLLER] User ID:", req.user?._id);

    if (!otp) {
      throw new AppError("Vui lòng cung cấp mã OTP", 400);
    }

    const result = await authService.verifyEmailOtp(req.user._id, otp);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: { user: result.user },
    });
  } catch (error) {
    next(error);
  }
};
