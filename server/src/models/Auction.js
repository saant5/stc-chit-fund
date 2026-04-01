const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChitGroup",
      required: true,
    },
    monthNumber: {
      type: Number,
      required: true,
    },
    winnerMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChitMember",
      default: null,
    },
    chitAmount: {
      type: Number,
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    dividendPerMember: {
      type: Number,
      required: true,
      default: 0,
    },
    payablePrizeAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "completed"],
      default: "upcoming",
    },
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);