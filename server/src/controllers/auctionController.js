// server/src/controllers/auctionController.js
const Auction     = require("../models/Auction");
const ChitGroup   = require("../models/ChitGroup");
const ChitMember  = require("../models/ChitMember");
const ChitPlan    = require("../models/ChitPlan");
const Installment = require("../models/Installment");

// ── GET /api/auctions/live  — all live + upcoming auctions ───────────────────
exports.getLiveAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ status: { $in: ["live", "upcoming"] } })
      .populate({ path: "groupId", populate: { path: "planId", select: "planName chitAmount monthlySubscription" } })
      .populate({ path: "winnerMemberId", populate: { path: "userId", select: "name" } })
      .sort({ status: -1, createdAt: 1 });

    res.json(auctions.map(formatAuction));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ── GET /api/auctions/history  — completed auctions ──────────────────────────
exports.getAuctionHistory = async (req, res) => {
  try {
    const auctions = await Auction.find({ status: "completed" })
      .populate({ path: "groupId", populate: { path: "planId", select: "planName chitAmount" } })
      .populate({ path: "winnerMemberId", populate: { path: "userId", select: "name" } })
      .sort({ endedAt: -1 })
      .limit(20);

    res.json(auctions.map(formatAuction));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ── GET /api/auctions/:id  — single auction details ──────────────────────────
exports.getAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate({ path: "groupId", populate: { path: "planId" } })
      .populate({ path: "winnerMemberId", populate: { path: "userId", select: "name" } });

    if (!auction) return res.status(404).json({ msg: "Auction not found" });
    res.json(formatAuction(auction));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ── POST /api/auctions/create  (admin) — create auction for a group ──────────
exports.createAuction = async (req, res) => {
  try {
    const { groupId } = req.body;

    const group = await ChitGroup.findById(groupId).populate("planId");
    if (!group) return res.status(404).json({ msg: "Group not found" });
    if (group.status !== "active") return res.status(400).json({ msg: "Group is not active" });

    // check no live/upcoming auction for this group + month
    const existing = await Auction.findOne({
      groupId, monthNumber: group.currentMonth,
      status: { $in: ["live", "upcoming"] }
    });
    if (existing) return res.status(400).json({ msg: "Auction already exists for this month" });

    const auction = await Auction.create({
      groupId,
      monthNumber:        group.currentMonth,
      chitAmount:         group.planId.chitAmount,
      bidAmount:          0,
      dividendPerMember:  0,
      payablePrizeAmount: group.planId.chitAmount,
      status:             "upcoming",
    });

    res.json({ msg: "Auction created", auction: formatAuction(auction) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ── POST /api/auctions/:id/start  (admin) — go live ──────────────────────────
exports.startAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ msg: "Auction not found" });
    if (auction.status !== "upcoming") return res.status(400).json({ msg: "Only upcoming auctions can be started" });

    auction.status    = "live";
    auction.startedAt = new Date();
    await auction.save();

    // emit to all clients in this group's room
    const io = req.app.get("io");
    if (io) io.to(`auction_${auction._id}`).emit("auction:started", { auctionId: auction._id });

    res.json({ msg: "Auction started", auction: formatAuction(auction) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ── POST /api/auctions/:id/close  (admin) — declare winner + update dividends──
exports.closeAuction = async (req, res) => {
  try {
    const { winnerMemberId } = req.body;
    const auction = await Auction.findById(req.params.id).populate("groupId");
    if (!auction) return res.status(404).json({ msg: "Auction not found" });
    if (auction.status !== "live") return res.status(400).json({ msg: "Auction is not live" });

    const group   = auction.groupId;
    const members = await ChitMember.find({ groupId: group._id, status: "active" });
    const count   = members.length || 1;

    // dividend = (chitAmount - bidAmount) / memberCount
    const dividend         = Math.floor((auction.chitAmount - auction.bidAmount) / count);
    const payablePrize     = auction.chitAmount - auction.bidAmount;

    auction.status             = "completed";
    auction.winnerMemberId     = winnerMemberId || null;
    auction.dividendPerMember  = dividend;
    auction.payablePrizeAmount = payablePrize;
    auction.endedAt            = new Date();
    await auction.save();

    // update all pending installments for this month with dividend
    await Installment.updateMany(
      { groupId: group._id, monthNumber: auction.monthNumber, paymentStatus: { $in: ["pending","overdue"] } },
      { $set: { dividend, balanceSubscription: 0, dueAmount: 0 } } // dueAmount recalculated below
    );

    // recalculate dueAmount properly for each installment
    const installments = await Installment.find({ groupId: group._id, monthNumber: auction.monthNumber });
    for (const inst of installments) {
      inst.dueAmount           = Math.max(inst.monthlySubscription - dividend, 0);
      inst.balanceSubscription = inst.dueAmount;
      await inst.save();
    }

    // mark winner
    if (winnerMemberId) {
      await ChitMember.findByIdAndUpdate(winnerMemberId, { hasWonPrize: true, prizeWonMonth: auction.monthNumber });
    }

    // emit result to room
    const io = req.app.get("io");
    if (io) {
      io.to(`auction_${auction._id}`).emit("auction:closed", {
        auctionId: auction._id,
        winnerMemberId,
        bidAmount:   auction.bidAmount,
        dividend,
        payablePrize,
      });
    }

    res.json({ msg: "Auction closed", dividend, payablePrize, auction: formatAuction(auction) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ── Helper ────────────────────────────────────────────────────────────────────
function formatAuction(a) {
  return {
    id:                 a._id,
    groupId:            a.groupId?._id || a.groupId,
    groupName:          a.groupId?.groupName || "—",
    planName:           a.groupId?.planId?.planName || "—",
    chitAmount:         a.chitAmount,
    monthlySubscription:a.groupId?.planId?.monthlySubscription || 0,
    monthNumber:        a.monthNumber,
    bidAmount:          a.bidAmount,
    dividendPerMember:  a.dividendPerMember,
    payablePrizeAmount: a.payablePrizeAmount,
    status:             a.status,
    startedAt:          a.startedAt,
    endedAt:            a.endedAt,
    winnerName:         a.winnerMemberId?.userId?.name || null,
    winnerMemberId:     a.winnerMemberId?._id || a.winnerMemberId || null,
    totalMembers:       a.groupId?.membersJoined || 0,
  };
}