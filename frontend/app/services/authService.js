import api from "./api";

/**
 * Đăng ký tài khoản mới
 * @param {Object} userData - { username, fullName, email, password, passwordConfirm, recaptchaToken }
 */
const signup = (userData) => {
  return api.post("/auth/register", {
    username: userData.username || userData.name,
    fullName: userData.fullName || userData.name,
    email: userData.email,
    password: userData.password,
    passwordConfirm: userData.passwordConfirm,
    recaptchaToken: userData.recaptchaToken,
  });
};

/**
 * Xác thực OTP để kích hoạt tài khoản
 * @param {Object} data - { email, otp }
 */
const verifyOtp = (data) => {
  return api.post("/auth/verify-otp", data);
};

/**
 * Đăng nhập
 * @param {Object} userData - { email, password }
 */
const signin = (userData) => {
  return api.post("/auth/login", userData);
};

/**
 * Đăng xuất
 */
const signout = () => {
  return api.post("/auth/logout");
};

const logout = () => {
  return api.post("/auth/logout");
};

/**
 * Lấy thông tin user hiện tại
 */
const getCurrentUser = () => {
  return api.get("/auth/me");
};

/**
 * Gửi OTP để reset mật khẩu
 * @param {string} email
 */
const forgotPassword = (email) => {
  return api.post("/auth/forgot-password", { email });
};

/**
 * Reset mật khẩu với OTP
 * @param {Object} data - { email, otp, newPassword }
 */
const resetPassword = (data) => {
  return api.post("/auth/reset-password", data);
};

/**
 * Đổi mật khẩu
 * @param {Object} data - { oldPassword, newPassword }
 */
const changePassword = (data) => {
  return api.post("/auth/change-password", data);
};

/**
 * Cập nhật thông tin cá nhân
 * @param {Object} data - { fullName, dateOfBirth, contactPhone, address, profileImageUrl }
 */
const updateProfile = (data) => {
  return api.put("/auth/profile", data);
};

/**
 * Cập nhật email (cần verify lại)
 * @param {string} newEmail
 */
const updateEmail = (newEmail) => {
  return api.put("/auth/email", { newEmail });
};

export default {
  signup,
  verifyOtp,
  signin,
  signout,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  updateEmail,
};
