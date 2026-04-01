// server/src/controllers/dashboardController.js
const ChitMember  = require("../models/ChitMember");
const ChitGroup   = require("../models/ChitGroup");
const Installment = require("../models/Installment");
const Auction     = require("../models/Auction");
const User        = require("../models/User");

// GET /api/dashboard/stats  (admin)
exports.getAdminStats = async (req, res) => {
  try {
    const totalMembers   = await ChitMember.countDocuments({ status: "active" });
    const activeGroups   = await ChitGroup.countDocuments({ status: "active" });
    const upcomingGroups = await ChitGroup.countDocuments({ status: "upcoming" });

    // total corpus = sum of all chitAmounts across active groups
    const groups = await ChitGroup.find({ status: "active" }).populate("planId", "chitAmount");
    const totalCorpus = groups.reduce((sum, g) => sum + (g.planId?.chitAmount || 0), 0);

    // monthly collection = sum of all paid installments this month
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const collectionAgg = await Installment.aggregate([
      { $match: { paymentStatus: "paid", paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);
    const monthlyCollection = collectionAgg[0]?.total || 0;

    // pending dues
    const pendingAgg = await Installment.aggregate([
      { $match: { paymentStatus: { $in: ["pending", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } },
    ]);
    const pendingDues = pendingAgg[0]?.total || 0;

    // live / upcoming auctions
    const liveAuctions     = await Auction.countDocuments({ status: "live" });
    const upcomingAuctions = await Auction.countDocuments({ status: "upcoming" });

    res.json({
      totalMembers,
      activeGroups,
      upcomingGroups,
      totalCorpus,
      monthlyCollection,
      pendingDues,
      liveAuctions,
      upcomingAuctions,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/dashboard/user-stats  (logged-in user)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberships = await ChitMember.find({ userId, status: "active" })
      .populate({ path: "groupId", populate: { path: "planId", select: "planName chitAmount monthlySubscription" } });

    // total paid by this user
    const paidAgg = await Installment.aggregate([
      { $match: { memberId: { $in: memberships.map(m => m._id) }, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);
    const totalPaid = paidAgg[0]?.total || 0;

    // outstanding dues for this user
    const dueAgg = await Installment.aggregate([
      { $match: { memberId: { $in: memberships.map(m => m._id) }, paymentStatus: { $in: ["pending", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } },
    ]);
    const totalDue = dueAgg[0]?.total || 0;

    // next auction across user's groups
    const nextAuction = await Auction.findOne({
      groupId: { $in: memberships.map(m => m.groupId?._id) },
      status: { $in: ["upcoming", "live"] },
    }).sort({ createdAt: 1 }).populate("groupId", "groupName");

    res.json({
      activeGroups: memberships.length,
      totalPaid,
      totalDue,
      nextAuction: nextAuction
        ? { group: nextAuction.groupId?.groupName, month: nextAuction.monthNumber, status: nextAuction.status }
        : null,
      memberships: memberships.map(m => ({
        id:          m._id,
        groupId:     m.groupId?._id,
        groupName:   m.groupId?.groupName,
        planName:    m.groupId?.planId?.planName,
        chitAmount:  m.groupId?.planId?.chitAmount,
        monthly:     m.groupId?.planId?.monthlySubscription,
        currentMonth:m.groupId?.currentMonth,
        totalMonths: 25,
        memberNumber:m.memberNumber,
        hasWonPrize: m.hasWonPrize,
      })),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/dashboard/recent-transactions  (admin)
exports.getRecentTransactions = async (req, res) => {
  try {
    const txns = await Installment.find({ paymentStatus: "paid" })
      .sort({ paidAt: -1 })
      .limit(10)
      .populate({
        path: "memberId",
        populate: { path: "userId", select: "name email" },
      })
      .populate({ path: "groupId", select: "groupName" });

    res.json(txns.map(t => ({
      id:           t._id,
      memberName:   t.memberId?.userId?.name || "Unknown",
      group:        t.groupId?.groupName || "—",
      month:        t.monthNumber,
      amount:       t.paidAmount,
      paidAt:       t.paidAt,
      subscription: t.monthlySubscription,
      dividend:     t.dividend,
      balance:      t.balanceSubscription,
    })));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};