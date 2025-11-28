// ROUTES: Authentication Routes


import express from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
  forgotPassword
} from '../controllers/auth.js';
import { authenticate } from '../middlewares/auth.js';
import {
  validateRegisterInput,
  validateLoginInput
} from '../middlewares/validation.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới
 */
router.post('/register', validateRegisterInput, register);

/**
 * POST /api/auth/login
 * Đăng nhập
 */
router.post('/login', validateLoginInput, login);

/**
 * POST /api/auth/logout
 * Đăng xuất
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu
 */
router.post('/change-password', authenticate, changePassword);

/**
 * POST /api/auth/forgot-password
 * Quên mật khẩu
 */
router.post('/forgot-password', forgotPassword);

export default router;
