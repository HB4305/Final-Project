import api from "./api";

/**
 * Lấy thông tin user hiện tại (từ auth service)
 */
const getMe = () => {
  return api.get("/auth/me");
};

/**
 * Cập nhật thông tin cá nhân
 * @param {Object} userData - { fullName, dateOfBirth, contactPhone, address, profileImageUrl }
 */
const updateMe = (userData) => {
  return api.put("/auth/profile", userData);
};

/**
 * Đổi mật khẩu
 * @param {Object} passwordData - { oldPassword, newPassword }
 */
const changePassword = (passwordData) => {
  return api.post("/auth/change-password", passwordData);
};

/**
 * Yêu cầu đổi mật khẩu (Gửi OTP)
 * @param {string} oldPassword
 */
const requestChangePassword = (oldPassword) => {
  return api.post("/auth/change-password-request", { oldPassword });
};

/**
 * Xác nhận đổi mật khẩu (Verify OTP)
 * @param {string} otp
 * @param {string} newPassword
 */
const confirmChangePassword = (otp, newPassword) => {
  return api.post("/auth/change-password-confirm", { otp, newPassword });
};

/**
 * Cập nhật email (cần verify OTP)
 * @param {Object} emailData - { newEmail }
 */
const updateEmail = (emailData) => {
  return api.put("/auth/email", emailData);
};

/**
 * Xác thực OTP cho email mới
 * @param {Object} otpData - { otp }
 */
const verifyEmailOtp = (otpData) => {
  return api.post("/auth/verify-email-otp", otpData);
};

/**
 * Lấy profile đầy đủ của user
 * @param {string} userId - Optional, nếu không có thì lấy của user hiện tại
 */
const getUserProfile = (userId) => {
  const endpoint = userId ? `/users/${userId}/profile` : "/users/me/profile";
  return api.get(endpoint);
};

/**
 * Lấy rating summary của user
 * @param {string} userId - Optional, nếu không có thì lấy của user hiện tại
 */
const getUserRatingSummary = (userId) => {
  const endpoint = userId
    ? `/users/${userId}/ratings/summary`
    : "/users/me/ratings/summary";
  return api.get(endpoint);
};

/**
 * Lấy danh sách ratings của user
 * @param {string} userId - Optional, nếu không có thì lấy của user hiện tại
 * @param {Object} params - { page, limit, context }
 */
const getUserRatings = (userId, params = {}) => {
  const endpoint = userId ? `/users/${userId}/ratings` : "/users/me/ratings";
  return api.get(endpoint, { params });
};

const submitUpgradeRequest = (request) => {
  return api.post("/users/upgrade-requests", request);
};

/**
 * Upload avatar
 * @param {FormData} formData - FormData containing 'avatar' file
 */
const uploadAvatar = (formData) => {
  return api.post("/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export default {
  getMe,
  updateMe,
  changePassword,
  requestChangePassword,
  confirmChangePassword,
  updateEmail,
  verifyEmailOtp,
  getUserProfile,
  getUserRatingSummary,
  getUserRatings,
  submitUpgradeRequest,
  uploadAvatar,
};
