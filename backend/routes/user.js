const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../src/models/User"); // Sửa đường dẫn nếu cần
const bcrypt = require("bcryptjs");

// @route   GET api/user/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/user/me
// @desc    Update user's profile
// @access  Private
router.put("/me", auth, async (req, res) => {
  const { fullName, address, dob, email } = req.body;

  // Build user object
  const userFields = {};
  if (fullName) userFields.fullName = fullName;
  if (address) userFields.address = address;
  if (dob) userFields.dob = dob; //
  if (email) userFields.email = email; //

  try {
    // Nếu đổi email, có thể cần flow verify lại email, nhưng ở đây tạm thời cho update luôn
    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/user/change-password
// @desc    Change password (requires old password)
// @access  Private
router.put("/change-password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body; //

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Please provide both old and new passwords" });
  }

  try {
    const user = await User.findById(req.user.id);

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Mật khẩu cũ không chính xác" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ msg: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
