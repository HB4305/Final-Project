// MIDDLEWARE: Input Validation

import { AppError } from "../utils/errors.js";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidObjectId,
  isValidAmount,
} from "../utils/validators.js";
import { ERROR_CODES } from "../lib/constants.js";

/**
 * Validate dữ liệu đăng ký người dùng
 */
export const validateRegisterInput = (req, res, next) => {
  try {
    const { username, email, password, fullName, recaptchaToken } = req.body;

    console.log("[VALIDATE REGISTER] Request body:", {
      username,
      email,
      hasPassword: !!password,
      fullName,
      hasRecaptcha: !!recaptchaToken,
    });

    if (!username || !email || !password || !fullName || !recaptchaToken) {
      const missing = [];
      if (!username) missing.push("username");
      if (!email) missing.push("email");
      if (!password) missing.push("password");
      if (!fullName) missing.push("fullName");
      if (!recaptchaToken) missing.push("recaptchaToken");
      console.log("[VALIDATE REGISTER] Missing fields:", missing);
      return next(
        new AppError(
          `Vui lòng cung cấp đầy đủ thông tin. Thiếu: ${missing.join(", ")}`,
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidUsername(username)) {
      console.log("[VALIDATE REGISTER] Invalid username:", username);
      return next(
        new AppError(
          "Username phải từ 3-30 ký tự, chỉ chứa chữ, số và underscore",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidEmail(email)) {
      console.log("[VALIDATE REGISTER] Invalid email:", email);
      return next(
        new AppError("Email không hợp lệ", 400, ERROR_CODES.INVALID_INPUT)
      );
    }

    if (!isValidPassword(password)) {
      console.log("[VALIDATE REGISTER] Invalid password format");
      return next(
        new AppError(
          "Mật khẩu phải ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    console.log("[VALIDATE REGISTER] Validation passed");
    next();
  } catch (error) {
    console.error("[VALIDATE REGISTER] Lỗi validate đăng ký:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu OTP
 */
export const validateOtpInput = (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(
        new AppError(
          "Vui lòng cung cấp email và mã OTP",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidEmail(email)) {
      return next(
        new AppError("Email không hợp lệ", 400, ERROR_CODES.INVALID_INPUT)
      );
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return next(
        new AppError("Mã OTP phải là 6 chữ số", 400, ERROR_CODES.INVALID_INPUT)
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE OTP] Lỗi validate OTP:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu đăng nhập
 */
export const validateLoginInput = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(
        new AppError(
          "Vui lòng cung cấp email và mật khẩu",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidEmail(email)) {
      return next(
        new AppError("Email không hợp lệ", 400, ERROR_CODES.INVALID_INPUT)
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE LOGIN] Lỗi validate đăng nhập:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu tạo/cập nhật sản phẩm
 */
export const validateProductInput = (req, res, next) => {
  try {
    const { title, categoryId, priceStep, startPrice, imageUrls } = req.body;

    if (
      !title ||
      !categoryId ||
      priceStep === undefined ||
      startPrice === undefined
    ) {
      return next(
        new AppError(
          "Vui lòng cung cấp đầy đủ thông tin sản phẩm",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (title.length < 10 || title.length > 200) {
      return next(
        new AppError(
          "Tiêu đề sản phẩm phải từ 10-200 ký tự",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidObjectId(categoryId)) {
      return next(
        new AppError("ID danh mục không hợp lệ", 400, ERROR_CODES.INVALID_INPUT)
      );
    }

    if (!isValidAmount(priceStep) || !isValidAmount(startPrice)) {
      return next(
        new AppError("Giá phải là số dương", 400, ERROR_CODES.INVALID_INPUT)
      );
    }

    if (!Array.isArray(imageUrls) || imageUrls.length < 3) {
      return next(
        new AppError(
          "Phải có ít nhất 3 hình ảnh",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE PRODUCT] Lỗi validate sản phẩm:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu tạo đấu giá
 */
export const validateAuctionInput = (req, res, next) => {
  try {
    const { startPrice, priceStep, startAt, endAt, buyNowPrice } = req.body;

    if (startPrice === undefined || !priceStep || !startAt || !endAt) {
      return next(
        new AppError(
          "Vui lòng cung cấp đầy đủ thông tin đấu giá",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidAmount(startPrice) || !isValidAmount(priceStep)) {
      return next(
        new AppError("Giá phải là số dương", 400, ERROR_CODES.INVALID_INPUT)
      );
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(
        new AppError(
          "Định dạng thời gian không hợp lệ",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (endDate <= startDate) {
      return next(
        new AppError(
          "Thời gian kết thúc phải sau thời gian bắt đầu",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (buyNowPrice && !isValidAmount(buyNowPrice)) {
      return next(
        new AppError(
          "Giá mua ngay phải là số dương",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE AUCTION] Lỗi validate đấu giá:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu đặt giá
 */
export const validateBidInput = (req, res, next) => {
  try {
    const { amount } = req.body;

    if (amount === undefined) {
      return next(
        new AppError(
          "Vui lòng nhập số tiền đặt giá",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidAmount(amount)) {
      return next(
        new AppError(
          "Số tiền đặt giá phải là số dương",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE BID] Lỗi validate đặt giá:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu auto-bid
 */
export const validateAutoBidInput = (req, res, next) => {
  try {
    const { maxAmount } = req.body;

    if (maxAmount === undefined) {
      return next(
        new AppError(
          "Vui lòng nhập mức giá tối đa",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (!isValidAmount(maxAmount)) {
      return next(
        new AppError(
          "Mức giá tối đa phải là số dương",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE AUTOBID] Lỗi validate auto-bid:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu câu hỏi
 */
export const validateQuestionInput = (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return next(
        new AppError(
          "Nội dung câu hỏi không được để trống",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (text.length > 500) {
      return next(
        new AppError(
          "Câu hỏi không được vượt quá 500 ký tự",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE QUESTION] Lỗi validate câu hỏi:", error);
    next(error);
  }
};

/**
 * Validate dữ liệu đánh giá
 */
export const validateRatingInput = (req, res, next) => {
  try {
    const { score, comment } = req.body;

    if (score === undefined) {
      return next(
        new AppError(
          "Vui lòng chọn điểm đánh giá",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (![1, -1].includes(score)) {
      return next(
        new AppError(
          "Điểm đánh giá phải là 1 (tích cực) hoặc -1 (tiêu cực)",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    if (comment && comment.length > 500) {
      return next(
        new AppError(
          "Nhận xét không được vượt quá 500 ký tự",
          400,
          ERROR_CODES.INVALID_INPUT
        )
      );
    }

    next();
  } catch (error) {
    console.error("[VALIDATE RATING] Lỗi validate đánh giá:", error);
    next(error);
  }
};

/**
 * Validate ID parameter
 */
export const validateIdParam = (paramName = "id") => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];

      if (!isValidObjectId(id)) {
        return next(
          new AppError(
            `${paramName} không hợp lệ`,
            400,
            ERROR_CODES.INVALID_INPUT
          )
        );
      }

      next();
    } catch (error) {
      console.error("[VALIDATE ID PARAM] Lỗi validate ID parameter:", error);
      next(error);
    }
  };
};
