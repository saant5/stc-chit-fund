const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll,
  adminBroadcast,
} = require("../controllers/notificationController");

router.get("/",                auth,        getNotifications);
router.put("/mark-all-read",   auth,        markAllRead);
router.put("/:id/read",        auth,        markRead);
router.delete("/",             auth,        clearAll);
router.delete("/:id",          auth,        deleteNotification);
router.post("/broadcast",      auth, admin, adminBroadcast);

module.exports = router;