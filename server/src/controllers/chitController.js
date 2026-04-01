// server/src/controllers/chitController.js
const ChitPlan   = require("../models/ChitPlan");
const ChitGroup  = require("../models/ChitGroup");
const ChitMember = require("../models/ChitMember");

exports.getPlans = async (req, res) => {
  try {
    const plans = await ChitPlan.find({ isActive: true });
    res.json(plans);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.createGroup = async (req, res) => {
  try {
    const { groupName, planId, startDate } = req.body;
    const plan = await ChitPlan.findById(planId);
    if (!plan) return res.status(404).json({ msg: "Plan not found" });
    const group = new ChitGroup({ groupName, planId, startDate, status: "active" });
    await group.save();
    res.json({ msg: "Group created", group });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await ChitGroup.find()
      .populate("planId", "planName chitAmount monthlySubscription totalMonths maxMembers");
    res.json(groups);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const group = await ChitGroup.findById(groupId).populate("planId");
    if (!group) return res.status(404).json({ msg: "Group not found" });
    const existing = await ChitMember.findOne({ userId, groupId });
    if (existing) return res.status(400).json({ msg: "Already joined this group" });
    if (group.membersJoined >= group.planId.maxMembers)
      return res.status(400).json({ msg: "Group is full" });
    const memberNumber = group.membersJoined + 1;
    const member = new ChitMember({ userId, groupId, memberNumber });
    await member.save();
    group.membersJoined += 1;
    await group.save();
    res.json({ msg: "Joined successfully", member });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await ChitMember.find({ userId, status: "active" })
      .populate({
        path: "groupId",
        populate: { path: "planId", select: "planName chitAmount monthlySubscription totalMonths" },
      });
    res.json(memberships);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

// GET /api/chits/groups/:groupId/members  (admin)
exports.getGroupMembers = async (req, res) => {
  try {
    const members = await ChitMember.find({ groupId: req.params.groupId, status: "active" })
      .populate("userId", "name email phone");
    res.json(members);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};