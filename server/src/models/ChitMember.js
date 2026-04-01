const mongoose = require("mongoose");

const chitMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChitGroup",
      required: true,
    },
    memberNumber: {
      type: Number,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "removed"],
      default: "active",
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    prizeWonMonth: {
      type: Number,
      default: null,
    },
    hasWonPrize: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChitMember", chitMemberSchema);