// INPUT VALIDATORS

/**
 * Validate email format
 * @param {string} email - Email cần validate
 * @returns {boolean} True nếu hợp lệ
 */
export const isValidEmail = (email) => {
  try {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    if (!isValid) {
      console.warn('[VALIDATOR] Invalid email format:', email);
    }
    return isValid;
  } catch (error) {
    console.error('[VALIDATOR] Email validation error:', error.message);
    return false;
  }
};

/**
 * Validate mật khẩu (ít nhất 8 ký tự, có số, chữ hoa, chữ thường)
 * @param {string} password - Mật khẩu cần validate
 * @returns {boolean} True nếu hợp lệ
 */
export const isValidPassword = (password) => {
  try {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    const isValid = regex.test(password);
    if (!isValid) {
      console.warn('[VALIDATOR] Invalid password format');
    }
    return isValid;
  } catch (error) {
    console.error('[VALIDATOR] Password validation error:', error.message);
    return false;
  }
};

/**
 * Validate phone number (định dạng VN: 10 số)
 * @param {string} phone - Số điện thoại
 * @returns {boolean} True nếu hợp lệ
 */
export const isValidPhoneVN = (phone) => {
  try {
    const regex = /^(0[1-9]\d{8,9})$/;
    const isValid = regex.test(phone);
    if (!isValid) {
      console.warn('[VALIDATOR] Invalid Vietnamese phone format:', phone);
    }
    return isValid;
  } catch (error) {
    console.error('[VALIDATOR] Phone validation error:', error.message);
    return false;
  }
};

/**
 * Validate username (3-30 ký tự, chữ và số)
 * @param {string} username - Tên đăng nhập
 * @returns {boolean} True nếu hợp lệ
 */
export const isValidUsername = (username) => {
  try {
    const regex = /^[a-zA-Z0-9_]{3,30}$/;
    const isValid = regex.test(username);
    if (!isValid) {
      console.warn('[VALIDATOR] Invalid username format:', username);
    }
    return isValid;
  } catch (error) {
    console.error('[VALIDATOR] Username validation error:', error.message);
    return false;
  }
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID cần validate
 * @returns {boolean} True nếu hợp lệ
 */
export const isValidObjectId = (id) => {
  try {
    const isValid = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValid) {
      console.warn('[VALIDATOR] Invalid MongoDB ObjectId:', id);
    }
    return isValid;
  } catch (error) {
    console.error('[VALIDATOR] ObjectId validation error:', error.message);
    return false;
  }
};

/**
 * Validate số tiền (phải > 0)
 * @param {number} amount - Số tiền
 * @returns {boolean} True nếu hợp lệ
 */
export const isValidAmount = (amount) => {
  try {
    const isValid = typeof amount === 'number' && amount > 0 && Number.isFinite(amount);
    if (!isValid) {
      console.warn('[VALIDATOR] Invalid amount:', amount);
    }
    return isValid;
  } catch (error) {
    console.error('[VALIDATOR] Amount validation error:', error.message);
    return false;
  }
};
