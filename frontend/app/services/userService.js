import api from "./api";

const getMe = () => {
  return api.get("/user/me");
};

const updateMe = (userData) => {
  // userData có thể gồm: { fullName, address, dob, email }
  return api.put("/user/me", userData);
};

// Hàm mới: Đổi mật khẩu (khi user đang đăng nhập)
const changePassword = (passwordData) => {
  // passwordData gồm: { oldPassword, newPassword }
  return api.put("/user/change-password", passwordData);
};

export default {
  getMe,
  updateMe,
  changePassword, // Nhớ export hàm này
};

