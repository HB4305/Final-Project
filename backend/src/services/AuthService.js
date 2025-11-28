// SERVICE: Authentication Service

import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import { generateTokenPair } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { ERROR_CODES, USER_ROLES, USER_STATUS } from '../lib/constants.js';

export class AuthService {
  /**
   * Đăng ký tài khoản người dùng mới
   * @param {Object} userData - { username, email, password, fullName }
   * @returns {Object} { user, accessToken, refreshToken }
   */
  async register(userData) {
    const { username, email, password, fullName } = userData;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email đã được đăng ký', 400, ERROR_CODES.USER_ALREADY_EXISTS);
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new AppError('Tên đăng nhập đã tồn tại', 400, ERROR_CODES.USER_ALREADY_EXISTS);
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo user mới
    const user = new User({
      username,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      roles: [USER_ROLES.BIDDER],
      status: USER_STATUS.ACTIVE
    });

    await user.save();

    // Tạo tokens
    const tokens = generateTokenPair(user);

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles
      },
      ...tokens
    };
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
      throw new AppError('Email hoặc mật khẩu không chính xác', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Kiểm tra user đã bị ban chưa
    if (user.status === USER_STATUS.BANNED) {
      throw new AppError('Tài khoản của bạn đã bị khóa', 403);
    }

    // Verify mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Tạo tokens
    const tokens = generateTokenPair(user);

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles
      },
      ...tokens
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
      throw new AppError('Người dùng không tồn tại', 404, ERROR_CODES.USER_NOT_FOUND);
    }

    // Verify mật khẩu cũ
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Mật khẩu cũ không chính xác', 401);
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    user.passwordHash = passwordHash;
    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Reset mật khẩu (dùng OTP hoặc email verification)
   * Tạm thời: chỉ return success
   */
  async resetPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Không reveal nếu email tồn tại hay không (security best practice)
      return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn reset mật khẩu' };
    }

    // TODO: Gửi email với OTP hoặc reset link
    return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn reset mật khẩu' };
  }

  /**
   * Lấy thông tin user từ token
   * @param {string} userId - ID của user
   * @returns {Object} Thông tin user
   */
  async getUserInfo(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404, ERROR_CODES.USER_NOT_FOUND);
    }
    return user;
  }
}

export const authService = new AuthService();
