const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
// ------------------------------------
const { body, validationResult } = require("express-validator");
const User = require("../src/models/User"); // Đảm bảo đường dẫn đúng
const sendEmail = require("../utils/sendEmail"); // Đảm bảo đường dẫn đúng

// Hàm sinh OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post(
  "/signup",
  [
    body("name", "Name is required").not().isEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log("\n-------- [SIGNUP REQUEST] --------");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, recaptchaToken } = req.body;

    try {
      // 1. Verify ReCaptcha
      if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
        console.log("🔄 Verifying ReCaptcha...");
        const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
        const recaptchaRes = await axios.post(recaptchaVerifyUrl);
        if (!recaptchaRes.data.success) {
          console.log("❌ ReCaptcha Failed");
          return res
            .status(400)
            .json({ errors: [{ msg: "ReCaptcha validation failed" }] });
        }
      }

      // 2. Check user exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      // 3. Create User (Unverified)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const otp = generateOTP();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 phút

      user = new User({
        fullName: name,
        email,
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false,
      });

      await user.save();

      // --- IN OTP RA TERMINAL ĐỂ TEST ---
      console.log("🔑 >>>>> OTP SIGNUP: " + otp + " <<<<<");
      // ----------------------------------

      // 4. Send OTP Email
      const message = `Mã xác thực đăng ký của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`;
      try {
        await sendEmail({
          email: user.email,
          subject: "Xác thực tài khoản - Sàn đấu giá",
          message,
        });
        res.status(200).json({
          msg: "Đăng ký thành công. Vui lòng kiểm tra email để lấy OTP.",
        });
      } catch (err) {
        console.error("❌ Email Error:", err.message);
        // Vẫn trả về thành công để nhập OTP từ terminal
        return res
          .status(200)
          .json({ msg: "Đăng ký thành công (Lỗi gửi mail - Xem Terminal)" });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST api/auth/verify-otp
// @desc    Verify OTP for account activation
// @access  Public
router.post("/verify-otp", async (req, res) => {
  console.log("\n-------- [VERIFY OTP] --------");
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ msg: "User already verified" });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res
        .status(400)
        .json({ msg: "OTP không chính xác hoặc đã hết hạn" });
    }

    // Verify Success
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Auto login (Return JWT)
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret",
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ msg: "Xác thực thành công", token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/login
// @desc    Login
// @access  Public
router.post(
  "/login",
  [
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user)
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });

      // Check Password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });

      // Check Verification
      if (!user.isVerified) {
        return res.status(400).json({
          errors: [
            { msg: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email." },
          ],
        });
      }

      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET || "secret",
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST api/auth/forgotpassword
// @desc    Send OTP for password reset
// @access  Public
router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save();

    // --- IN OTP RA TERMINAL ĐỂ TEST ---
    console.log("🔑 >>>>> OTP FORGOT PASS: " + otp + " <<<<<");
    // ----------------------------------

    const message = `Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là: ${otp}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password OTP",
        message,
      });
      res.status(200).json({ success: true, data: "OTP sent to email" });
    } catch (err) {
      console.error("❌ Email Error:", err.message);
      // Vẫn trả về success để test local
      res
        .status(200)
        .json({ success: true, data: "OTP sent (Check Terminal)" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/resetpassword
// @desc    Reset password using OTP
// @access  Public
router.post("/resetpassword", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ msg: "Invalid OTP or expired" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
