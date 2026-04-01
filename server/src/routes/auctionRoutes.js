// server/src/routes/auctionRoutes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const {
  getLiveAuctions,
  getAuctionHistory,
  getAuction,
  createAuction,
  startAuction,
  closeAuction,
} = require("../controllers/auctionController");

// Public / user
router.get("/live",         auth, getLiveAuctions);
router.get("/history",      auth, getAuctionHistory);
router.get("/:id",          auth, getAuction);

// Admin only
router.post("/create",      auth, admin, createAuction);
router.post("/:id/start",   auth, admin, startAuction);
router.post("/:id/close",   auth, admin, closeAuction);

module.exports = router;