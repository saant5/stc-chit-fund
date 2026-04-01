const mongoose = require("mongoose");

const chitGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChitPlan",
      required: true,
    },
    chitAmount: {
      type: Number,
      required: true,
    },
    durationMonths: {
      type: Number,
      required: true,
    },
    memberLimit: {
      type: Number,
      required: true,
    },
    monthlyInstallment: {
      type: Number,
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ["member", "admin"],
          default: "member",
        },
      },
    ],
    currentMonth: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["open", "full", "active", "completed", "cancelled"],
      default: "open",
    },
    auctionCompletedMonths: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChitGroup", chitGroupSchema);