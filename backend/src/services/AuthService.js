// SERVICE: Authentication Service

import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";
import { User } from "../models/index.js";
import { PendingUser } from "../models/PendingUser.js";
import { generateTokenPair } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";
import { ERROR_CODES, USER_ROLES, USER_STATUS } from "../lib/constants.js";
import { sendEmail } from "../utils/sendEmail.js";

export class AuthService {
  /**
   * Đăng ký tài khoản người dùng mới và gửi OTP
   * @param {Object} userData - { username, email, password, fullName }
   * @returns {Object} { message }
   */
  async register(userData) {
    const { username, email, password, fullName, address } = userData;

    // Kiểm tra email đã tồn tại trong User (đã verify)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError(
        "Email đã được đăng ký",
        400,
        ERROR_CODES.USER_ALREADY_EXISTS
      );
    }

    // Kiểm tra username đã tồn tại trong User
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new AppError(
        "Tên đăng nhập đã tồn tại",
        400,
        ERROR_CODES.USER_ALREADY_EXISTS
      );
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo mã OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Xóa pending user cũ nếu có (user đăng ký lại với cùng email)
    await PendingUser.deleteMany({ email: email.toLowerCase() });

    // Xóa pending user với username này nếu có
    await PendingUser.deleteMany({ username });

    // Lưu vào PendingUser (chưa tạo User thật)
    const pendingUser = new PendingUser({
      username,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      address,
      otp: {
        code: otp,
        expiresAt: otpExpiresAt,
      },
    });
    console.log("[AUTH SERVICE] Saving PendingUser with address:", address);
    await pendingUser.save();

    // Gửi email chứa OTP
    try {
      await sendEmail({
        to: pendingUser.email,
        subject: "Mã xác thực đăng ký tài khoản",
        html: `<p>Mã OTP của bạn là: <b>${otp}</b>. Mã này sẽ hết hạn trong 10 phút.</p>`,
      });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      // Xóa pending user nếu không gửi được email
      await PendingUser.deleteOne({ _id: pendingUser._id });
      throw new AppError(
        "Không thể gửi email xác thực. Vui lòng thử lại.",
        500
      );
    }

    return {
      message:
        "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
    };
  }

  /**
   * Xác thực OTP và tạo tài khoản chính thức
   * @param {Object} data - { email, otp }
   */
  async verifyOtp(data) {
    const { email, otp } = data;

    // Tìm trong PendingUser
    const pendingUser = await PendingUser.findOne({
      email: email.toLowerCase(),
    });

    if (!pendingUser) {
      throw new AppError(
        "Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại.",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    if (!pendingUser.otp || pendingUser.otp.code !== otp) {
      throw new AppError(
        "Mã OTP không chính xác.",
        400,
        ERROR_CODES.INVALID_OTP
      );
    }

    if (new Date() > new Date(pendingUser.otp.expiresAt)) {
      // Xóa pending user đã hết hạn
      await PendingUser.deleteOne({ _id: pendingUser._id });
      throw new AppError(
        "Mã OTP đã hết hạn. Vui lòng đăng ký lại.",
        400,
        ERROR_CODES.OTP_EXPIRED
      );
    }

    // OTP đúng -> Tạo User chính thức
    console.log(
      "[AUTH SERVICE] Verifying OTP. PendingUser address:",
      pendingUser.address
    );

    const newUser = new User({
      username: pendingUser.username,
      email: pendingUser.email,
      passwordHash: pendingUser.passwordHash,
      fullName: pendingUser.fullName,
      address: pendingUser.address || {},
      roles: [USER_ROLES.BIDDER],
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await newUser.save();

    // Xóa pending user sau khi tạo thành công
    await PendingUser.deleteOne({ _id: pendingUser._id });

    return { message: "Xác thực tài khoản thành công." };
  }

  /**
   * Đăng nhập bằng email và mật khẩu
   * @param {Object} credentials - { email, password }
   * @returns {Object} { user, accessToken, refreshToken }
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Tìm user theo email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError(
        "Email hoặc mật khẩu không chính xác",
        401,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Kiểm tra đã xác thực email chưa
    if (!user.emailVerified) {
      throw new AppError(
        "Vui lòng xác thực email của bạn trước khi đăng nhập.",
        403,
        ERROR_CODES.EMAIL_NOT_VERIFIED
      );
    }

    // Kiểm tra user đã bị ban chưa
    if (user.status === USER_STATUS.BANNED) {
      throw new AppError("Tài khoản của bạn đã bị khóa", 403);
    }

    // Verify mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(
        "Email hoặc mật khẩu không chính xác",
        401,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Tạo tokens
    const tokens = generateTokenPair(user);

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
      ...tokens,
    };
  }

  /**
   * Đổi mật khẩu cho user đã đăng nhập
   * @param {string} userId - ID của user
   * @param {Object} passwordData - { oldPassword, newPassword }
   */
  async changePassword(userId, passwordData) {
    const { oldPassword, newPassword } = passwordData;

    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Check if user is Google user setting password for first time
    const isGoogleUser = !!user.googleId;
    const isSettingPassword = isGoogleUser && !oldPassword;

    if (isSettingPassword) {
      // Google user setting password for first time - no old password needed
      console.log(
        "[CHANGE PASSWORD] Google user setting password for first time"
      );
    } else {
      // Normal password change - verify old password
      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        user.passwordHash
      );
      if (!isPasswordValid) {
        throw new AppError("Mật khẩu cũ không chính xác", 401);
      }

      if (oldPassword === newPassword) {
        throw new AppError("Mật khẩu mới phải khác mật khẩu hiện tại", 400);
      }
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    user.passwordHash = passwordHash;
    await user.save();

    return {
      message: isSettingPassword
        ? "Đặt mật khẩu thành công. Bây giờ bạn có thể đăng nhập bằng email và mật khẩu."
        : "Đổi mật khẩu thành công",
    };
  }

  /**
   * Gửi OTP để reset mật khẩu (Bước 1: Forgot Password)
   * @param {string} email - Email của user
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Không reveal nếu email tồn tại hay không (security best practice)
      return {
        message: "Nếu email tồn tại, bạn sẽ nhận được mã OTP để reset mật khẩu",
      };
    }

    // Tạo mã OTP mới
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Lưu OTP vào database
    user.otp = { code: otp, expiresAt: otpExpiresAt };
    await user.save();

    // Gửi email chứa OTP
    try {
      await sendEmail({
        to: user.email,
        subject: "Mã OTP reset mật khẩu",
        html: `<p>Mã OTP để reset mật khẩu của bạn là: <b>${otp}</b>. Mã này sẽ hết hạn trong 10 phút.</p>`,
      });
    } catch (error) {
      console.error("Failed to send reset password OTP email:", error);
      // Không throw error để không reveal email có tồn tại hay không
    }

    return {
      message: "Nếu email tồn tại, bạn sẽ nhận được mã OTP để reset mật khẩu",
    };
  }

  /**
   * Reset mật khẩu với OTP (Bước 2: Reset Password)
   * @param {Object} data - { email, otp, newPassword }
   */
  async resetPasswordWithOtp(data) {
    const { email, otp, newPassword } = data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError(
        "Email không tồn tại.",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Kiểm tra OTP
    if (!user.otp || user.otp.code !== otp) {
      throw new AppError(
        "Mã OTP không chính xác.",
        400,
        ERROR_CODES.INVALID_OTP
      );
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      throw new AppError("Mã OTP đã hết hạn.", 400, ERROR_CODES.OTP_EXPIRED);
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu và xóa OTP
    user.passwordHash = passwordHash;
    user.otp = undefined;
    await user.save();

    return {
      message:
        "Reset mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.",
    };
  }

  /**
   * Lấy thông tin user từ token
   * @param {string} userId - ID của user
   * @returns {Object} Thông tin user
   */
  async getUserInfo(userId) {
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }
    return user;
  }

  /**
   * Cập nhật thông tin cá nhân
   * @param {string} userId - ID của user
   * @param {Object} updateData - { fullName, dateOfBirth, contactPhone, address }
   */
  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Các field được phép cập nhật
    const allowedFields = [
      "fullName",
      "dateOfBirth",
      "contactPhone",
      "address",
      "profileImageUrl",
    ];

    // Cập nhật từng field được phép
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        user[key] = updateData[key];
      }
    });

    await user.save();

    // Trả về user không có passwordHash
    return await User.findById(userId).select("-passwordHash");
  }

  /**
   * Cập nhật email (cần verify lại)
   * @param {string} userId - ID của user
   * @param {string} newEmail - Email mới
   */
  async updateEmail(userId, newEmail) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Kiểm tra email mới có trùng với user khác không
    const existingUser = await User.findOne({
      email: newEmail.toLowerCase(),
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new AppError(
        "Email này đã được sử dụng",
        400,
        ERROR_CODES.USER_ALREADY_EXISTS
      );
    }

    // Tạo OTP để verify email mới
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log("[UPDATE EMAIL] Generated OTP:", otp, "for user:", userId);

    // Cập nhật email mới và đặt emailVerified = false
    user.email = newEmail.toLowerCase();
    user.emailVerified = false;
    user.otp = { code: otp, expiresAt: otpExpiresAt };
    await user.save();

    console.log("[UPDATE EMAIL] Saved OTP to user. Email:", newEmail);

    // Gửi OTP đến email mới
    try {
      await sendEmail({
        to: newEmail,
        subject: "Xác thực email mới",
        html: `<p>Mã OTP để xác thực email mới của bạn là: <b>${otp}</b>. Mã này sẽ hết hạn trong 10 phút.</p>`,
      });
    } catch (error) {
      console.error("Failed to send email verification:", error);
    }

    return {
      message:
        "Email đã được cập nhật. Vui lòng kiểm tra email mới để xác thực.",
      email: newEmail,
    };
  }

  /**
   * Xác thực OTP cho email mới
   * @param {string} userId - ID của user
   * @param {string} otp - Mã OTP
   */
  async verifyEmailOtp(userId, otp) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    console.log("[VERIFY EMAIL OTP] User ID:", userId);
    console.log("[VERIFY EMAIL OTP] Received OTP:", otp, "Type:", typeof otp);
    console.log(
      "[VERIFY EMAIL OTP] Stored OTP:",
      user.otp?.code,
      "Type:",
      typeof user.otp?.code
    );

    // Kiểm tra OTP
    if (!user.otp || !user.otp.code) {
      console.log("[VERIFY EMAIL OTP] No OTP found in user");
      throw new AppError(
        "Không tìm thấy mã OTP. Vui lòng yêu cầu gửi lại.",
        400,
        ERROR_CODES.INVALID_OTP
      );
    }

    if (user.otp.code !== otp) {
      console.log("[VERIFY EMAIL OTP] OTP mismatch!");
      throw new AppError(
        "Mã OTP không chính xác",
        400,
        ERROR_CODES.INVALID_OTP
      );
    }

    if (new Date() > user.otp.expiresAt) {
      throw new AppError("Mã OTP đã hết hạn", 400, ERROR_CODES.EXPIRED_OTP);
    }

    // Xác thực email thành công
    user.emailVerified = true;
    user.otp = undefined; // Xóa OTP
    await user.save();

    return {
      message: "Email đã được xác thực thành công",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName,
      },
    };
  }

  /**
   * Yêu cầu đổi mật khẩu (Bước 1: Xác thực mật khẩu cũ và gửi OTP)
   * @param {string} userId - ID của user
   * @param {string} oldPassword - Mật khẩu cũ
   */
  async requestChangePassword(userId, oldPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Verify old password (skip if Google user setting password for first time)
    const isGoogleUser = !!user.socialIds?.googleId;
    const isSettingPassword = isGoogleUser && !user.passwordHash;

    if (!isSettingPassword) {
      if (!oldPassword) {
        throw new AppError("Vui lòng nhập mật khẩu cũ", 400);
      }
      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        user.passwordHash
      );
      if (!isPasswordValid) {
        throw new AppError("Mật khẩu cũ không chính xác", 401);
      }
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    user.otp = { code: otp, expiresAt: otpExpiresAt };
    await user.save();

    // Send Email
    try {
      await sendEmail({
        to: user.email,
        subject: "Mã xác thực đổi mật khẩu",
        html: `<p>Bạn đang yêu cầu đổi mật khẩu. Mã OTP của bạn là: <b>${otp}</b>. Mã này sẽ hết hạn trong 10 phút.</p>`,
      });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw new AppError(
        "Không thể gửi email xác thực. Vui lòng thử lại.",
        500
      );
    }

    return { message: "Mã OTP đã được gửi đến email của bạn." };
  }

  /**
   * Xác nhận đổi mật khẩu (Bước 2: Verify OTP và cập nhật mật khẩu)
   * @param {string} userId - ID của user
   * @param {Object} data - { otp, newPassword }
   */
  async confirmChangePassword(userId, data) {
    const { otp, newPassword } = data;
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    // Verify OTP
    if (!user.otp || user.otp.code !== otp) {
      throw new AppError(
        "Mã OTP không chính xác",
        400,
        ERROR_CODES.INVALID_OTP
      );
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      throw new AppError("Mã OTP đã hết hạn", 400, ERROR_CODES.OTP_EXPIRED);
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new AppError("Mật khẩu mới phải khác mật khẩu hiện tại", 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP
    user.passwordHash = passwordHash;
    user.otp = undefined;
    await user.save();

    return { message: "Đổi mật khẩu thành công." };
  }
}

export const authService = new AuthService();
