// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS TO: server/src/controllers/adminController.js  (NEW FILE)
// ─────────────────────────────────────────────────────────────────────────────
const ChitMember  = require("../models/ChitMember");
const ChitGroup   = require("../models/ChitGroup");
const Installment = require("../models/Installment");
const User        = require("../models/User");

// GET /api/admin/members — all members across all groups
exports.getAllMembers = async (req, res) => {
  try {
    const members = await ChitMember.find({ status: "active" })
      .populate({ path: "userId",  select: "name email phone role" })
      .populate({ path: "groupId", populate: { path: "planId", select: "planName monthlySubscription" } })
      .sort({ createdAt: -1 });

    const result = await Promise.all(members.map(async m => {
      // get pending installment for current month
      const group = m.groupId;
      const due   = await Installment.findOne({
        memberId:      m._id,
        monthNumber:   group?.currentMonth || 1,
        paymentStatus: { $in: ["pending", "overdue"] },
      });

      return {
        _id:          m._id,
        memberNumber: m.memberNumber,
        name:         m.userId?.name  || "Unknown",
        email:        m.userId?.email || "—",
        phone:        m.userId?.phone || "—",
        groupId:      group?._id,
        groupName:    group?.groupName || "—",
        planName:     group?.planId?.planName || "—",
        totalPaid:    m.totalPaid || 0,
        hasWonPrize:  m.hasWonPrize,
        currentMonth: group?.currentMonth || 1,
        dueAmount:    due?.dueAmount || 0,
        dueStatus:    due?.paymentStatus || "paid",
        installmentId:due?._id || null,
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/admin/defaulters — members with pending dues
exports.getDefaulters = async (req, res) => {
  try {
    const overdue = await Installment.find({
      paymentStatus: { $in: ["pending", "overdue"] },
    })
      .populate({ path: "memberId", populate: { path: "userId", select: "name email phone" } })
      .populate({ path: "groupId", select: "groupName currentMonth" })
      .sort({ createdAt: -1 });

    res.json(overdue.map(i => ({
      installmentId: i._id,
      memberId:      i.memberId?._id,
      name:          i.memberId?.userId?.name  || "Unknown",
      email:         i.memberId?.userId?.email || "—",
      phone:         i.memberId?.userId?.phone || "—",
      groupName:     i.groupId?.groupName      || "—",
      monthNumber:   i.monthNumber,
      dueAmount:     i.dueAmount,
      status:        i.paymentStatus,
    })));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// POST /api/admin/record-payment — admin records cash/cheque payment for a member
exports.recordPayment = async (req, res) => {
  try {
    const { installmentId, paymentMode, referenceNumber, paidAmount } = req.body;

    const inst = await Installment.findById(installmentId);
    if (!inst) return res.status(404).json({ msg: "Installment not found" });

    if (inst.paymentStatus === "paid")
      return res.status(400).json({ msg: "Already paid" });

    const paid = paidAmount || inst.dueAmount;
    inst.paidAmount     = paid;
    inst.paymentStatus  = paid >= inst.dueAmount ? "paid" : "partial";
    inst.paidAt         = new Date();
    inst.paymentMode    = paymentMode || "Cash";
    inst.referenceNumber = referenceNumber || "";
    await inst.save();

    // update member total
    const member = await ChitMember.findById(inst.memberId);
    if (member) { member.totalPaid = (member.totalPaid || 0) + paid; await member.save(); }

    res.json({ msg: "Payment recorded successfully", installment: inst });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// POST /api/admin/advance-month/:groupId — move group to next month + create installments
exports.advanceMonth = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await ChitGroup.findById(groupId).populate("planId");
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const plan = group.planId;
    if (group.currentMonth >= plan.totalMonths)
      return res.status(400).json({ msg: "Group has completed all months" });

    group.currentMonth += 1;
    await group.save();

    // create installments for all active members for new month
    const members = await ChitMember.find({ groupId: group._id, status: "active" });
    let created = 0;
    for (const member of members) {
      const exists = await Installment.findOne({ memberId: member._id, monthNumber: group.currentMonth });
      if (exists) continue;
      await Installment.create({
        groupId:             group._id,
        memberId:            member._id,
        monthNumber:         group.currentMonth,
        monthlySubscription: plan.monthlySubscription,
        dividend:            0,
        balanceSubscription: plan.monthlySubscription,
        dueAmount:           plan.monthlySubscription,
        paymentStatus:       "pending",
      });
      created++;
    }

    res.json({
      msg:          `Advanced to Month ${group.currentMonth}`,
      currentMonth: group.currentMonth,
      installmentsCreated: created,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};