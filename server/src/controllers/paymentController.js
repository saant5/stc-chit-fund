// server/src/controllers/paymentController.js
const Installment = require("../models/Installment");
const ChitMember  = require("../models/ChitMember");
const ChitGroup   = require("../models/ChitGroup");
const Auction     = require("../models/Auction");

// ─── Helper: calculate dividend for a month ──────────────────────────────────
// dividend = (chitAmount - bidAmount) / totalMembers
const getDividend = async (groupId, monthNumber) => {
  const auction = await Auction.findOne({ groupId, monthNumber, status: "completed" });
  if (!auction) return 0;
  return auction.dividendPerMember || 0;
};

// GET /api/payments/my-installments
exports.getMyInstallments = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberships = await ChitMember.find({ userId, status: "active" })
      .populate({ path: "groupId", populate: { path: "planId" } });

    const result = [];

    for (const membership of memberships) {
      const group = membership.groupId;
      const plan  = group?.planId;
      if (!plan) continue;

      // get all installments for this member
      const installments = await Installment.find({ memberId: membership._id })
        .sort({ monthNumber: 1 });

      // find current month due
      const currentDue = installments.find(i =>
        i.paymentStatus === "pending" || i.paymentStatus === "overdue"
      );

      const totalPaid = installments
        .filter(i => i.paymentStatus === "paid")
        .reduce((sum, i) => sum + i.paidAmount, 0);

      result.push({
        membershipId:   membership._id,
        groupId:        group._id,
        groupName:      group.groupName,
        planName:       plan.planName,
        chitAmount:     plan.chitAmount,
        subscription:   plan.monthlySubscription,
        currentMonth:   group.currentMonth,
        totalMonths:    plan.totalMonths,
        totalPaid,
        hasWonPrize:    membership.hasWonPrize,
        currentDue: currentDue ? {
          installmentId: currentDue._id,
          monthNumber:   currentDue.monthNumber,
          subscription:  currentDue.monthlySubscription,
          dividend:      currentDue.dividend,
          dueAmount:     currentDue.dueAmount,
          status:        currentDue.paymentStatus,
        } : null,
        installments: installments.map(i => ({
          id:           i._id,
          monthNumber:  i.monthNumber,
          subscription: i.monthlySubscription,
          dividend:     i.dividend,
          balance:      i.balanceSubscription,
          dueAmount:    i.dueAmount,
          paidAmount:   i.paidAmount,
          status:       i.paymentStatus,
          paidAt:       i.paidAt,
        })),
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// POST /api/payments/pay  — record a payment (user pays their installment)
exports.payInstallment = async (req, res) => {
  try {
    const { installmentId, paymentMode, referenceNumber } = req.body;
    const userId = req.user.id;

    if (!installmentId) return res.status(400).json({ msg: "installmentId required" });

    const installment = await Installment.findById(installmentId).populate("memberId");
    if (!installment) return res.status(404).json({ msg: "Installment not found" });

    // verify this belongs to the requesting user
    const member = await ChitMember.findById(installment.memberId);
    if (!member || member.userId.toString() !== userId)
      return res.status(403).json({ msg: "Not authorised" });

    if (installment.paymentStatus === "paid")
      return res.status(400).json({ msg: "Already paid" });

    // record payment
    installment.paidAmount     = installment.dueAmount;
    installment.paymentStatus  = "paid";
    installment.paidAt         = new Date();
    installment.paymentMode    = paymentMode || "UPI";
    installment.referenceNumber= referenceNumber || "";
    await installment.save();

    // update member total paid
    member.totalPaid = (member.totalPaid || 0) + installment.dueAmount;
    await member.save();

    res.json({
      msg:     "Payment recorded successfully",
      amount:  installment.dueAmount,
      paidAt:  installment.paidAt,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/payments/history  — user's full payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberships = await ChitMember.find({ userId });

    const installments = await Installment.find({
      memberId: { $in: memberships.map(m => m._id) },
    })
      .sort({ paidAt: -1, monthNumber: -1 })
      .populate({ path: "groupId", select: "groupName" });

    res.json(installments.map(i => ({
      id:           i._id,
      group:        i.groupId?.groupName || "—",
      monthNumber:  i.monthNumber,
      subscription: i.monthlySubscription,
      dividend:     i.dividend,
      balance:      i.balanceSubscription,
      dueAmount:    i.dueAmount,
      paidAmount:   i.paidAmount,
      status:       i.paymentStatus,
      paidAt:       i.paidAt,
      paymentMode:  i.paymentMode || "—",
    })));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// POST /api/payments/admin/record  — admin records a cash/cheque payment
exports.adminRecordPayment = async (req, res) => {
  try {
    const { installmentId, paymentMode, referenceNumber, paidAmount } = req.body;

    const installment = await Installment.findById(installmentId);
    if (!installment) return res.status(404).json({ msg: "Installment not found" });

    const paid = paidAmount || installment.dueAmount;
    installment.paidAmount    = paid;
    installment.paymentStatus = paid >= installment.dueAmount ? "paid" : "partial";
    installment.paidAt        = new Date();
    installment.paymentMode   = paymentMode || "Cash";
    installment.referenceNumber = referenceNumber || "";
    await installment.save();

    // update member total
    const member = await ChitMember.findById(installment.memberId);
    if (member) { member.totalPaid = (member.totalPaid || 0) + paid; await member.save(); }

    res.json({ msg: "Payment recorded", installment });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/payments/admin/defaulters  — list members with overdue payments
exports.getDefaulters = async (req, res) => {
  try {
    const overdue = await Installment.find({ paymentStatus: { $in: ["overdue", "pending"] } })
      .populate({
        path: "memberId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate({ path: "groupId", select: "groupName" });

    res.json(overdue.map(i => ({
      installmentId: i._id,
      memberName:    i.memberId?.userId?.name,
      email:         i.memberId?.userId?.email,
      phone:         i.memberId?.userId?.phone,
      group:         i.groupId?.groupName,
      month:         i.monthNumber,
      dueAmount:     i.dueAmount,
      status:        i.paymentStatus,
    })));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};