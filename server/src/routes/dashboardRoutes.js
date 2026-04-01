const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const {
  getAdminStats,
  getUserStats,
  getRecentTransactions,
} = require("../controllers/dashboardController");

router.get("/stats",               auth, admin, getAdminStats);
router.get("/recent-transactions", auth, admin, getRecentTransactions);
router.get("/user-stats",          auth, getUserStats);

module.exports = router;