const mongoose = require("mongoose");

const chitPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
    },
    chitAmount: {
      type: Number,
      required: true,
    },
    totalMonths: {
      type: Number,
      required: true,
      default: 25,
    },
    monthlySubscription: {
      type: Number,
      required: true,
    },
    maxMembers: {
      type: Number,
      required: true,
      default: 25,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChitPlan", chitPlanSchema);