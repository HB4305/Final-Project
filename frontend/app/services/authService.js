import api from "./api";

// userData bao gồm: { name, email, password, recaptchaToken }
const signup = (userData) => {
  return api.post("/auth/signup", userData);
};

// Hàm mới: Xác thực OTP để kích hoạt tài khoản
const verifyOtp = (data) => {
  // data bao gồm: { email, otp }
  return api.post("/auth/verify-otp", data);
};

const signin = (userData) => {
  return api.post("/auth/signin", userData);
};

const forgotPassword = (email) => {
  return api.post("/auth/forgotpassword", { email });
};

// Cập nhật lại logic Reset Password theo luồng OTP
const resetPassword = (data) => {
  // data bao gồm: { email, otp, newPassword }
  // Backend đổi từ PUT /:token sang POST /resetpassword
  return api.post("/auth/resetpassword", data);
};

export default {
  signup,
  verifyOtp, // Nhớ export hàm này
  signin,
  forgotPassword,
  resetPassword,
};
