import { authService } from '../services/AuthService.js';
import { AppError } from '../utils/errors.js';

/**
 * Controller đăng ký tài khoản mới
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirm, fullName } = req.body;

    const result = await authService.register({
      username,
      email,
      password,
      fullName
    });

    // Gán tokens vào cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      status: 'success',
      message: 'Đăng ký thành công',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
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
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
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
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Đăng xuất thành công'
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
    const user = await authService.getUserInfo(req.user._id);

    res.status(200).json({
      status: 'success',
      data: { user }
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
      newPassword
    });

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller quên mật khẩu
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.resetPassword(email);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
