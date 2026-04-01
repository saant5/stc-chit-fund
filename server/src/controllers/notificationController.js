const Notification = require("../models/Notification");

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id, read: false,
    });
    res.json({ notifications, unreadCount });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true }
    );
    res.json({ msg: "Marked as read" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

// PUT /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false }, { read: true }
    );
    res.json({ msg: "All marked as read" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ msg: "Deleted" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

// DELETE /api/notifications  (clear all)
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ msg: "All notifications cleared" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

// POST /api/notifications/broadcast  (admin only)
exports.adminBroadcast = async (req, res) => {
  try {
    const { title, message, type = "system", userIds } = req.body;
    if (!title || !message)
      return res.status(400).json({ msg: "Title and message required" });

    const User = require("../models/User");
    let targets;
    if (userIds && userIds.length > 0) {
      targets = userIds;
    } else {
      const users = await User.find({ role: "user" }).select("_id");
      targets = users.map(u => u._id);
    }

    await Notification.insertMany(
      targets.map(uid => ({ userId: uid, title, message, type, read: false }))
    );

    const io = req.app.get("io");
    if (io) {
      targets.forEach(uid => {
        io.to(`user_${uid}`).emit("notification:new", { title, message, type });
      });
    }

    res.json({ msg: `Broadcast sent to ${targets.length} users` });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

// Helper — used by other controllers
exports.createNotification = async ({ userId, title, message, type = "system", link = "" }) => {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};