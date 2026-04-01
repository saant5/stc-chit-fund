// server/src/routes/chitRoutes.js — UPDATED with group members route
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const {
  getPlans,
  createGroup,
  getGroups,
  joinGroup,
  getMyGroups,
  getGroupMembers,
} = require("../controllers/chitController");

router.get("/plans",                       getPlans);
router.post("/groups",             auth, admin, createGroup);
router.get("/groups",              auth,        getGroups);
router.post("/groups/:groupId/join",auth,       joinGroup);
router.get("/my-groups",           auth,        getMyGroups);
router.get("/groups/:groupId/members", auth, admin, getGroupMembers);

module.exports = router;