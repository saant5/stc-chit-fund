// server/src/controllers/userController.js
const User    = require("../models/User");
const bcrypt  = require("bcryptjs");

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // check email uniqueness if changed
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ msg: "Email already in use by another account." });
      user.email = email.trim();
    }

    if (name)  user.name  = name.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    const updated = user.toObject();
    delete updated.password;

    // update localStorage on frontend via response
    res.json({ msg: "Profile updated successfully", user: updated });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// PUT /api/user/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ msg: "Both current and new password are required." });

    if (newPassword.length < 6)
      return res.status(400).json({ msg: "New password must be at least 6 characters." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};