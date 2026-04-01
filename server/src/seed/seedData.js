const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const ChitPlan = require("../models/ChitPlan");

dotenv.config();
connectDB();

const seedPlans = async () => {
  try {
    await ChitPlan.deleteMany();

    await ChitPlan.insertMany([
      {
        planName: "STC 5 Lakhs",
        chitAmount: 500000,
        totalMonths: 25,
        monthlySubscription: 20000,
        maxMembers: 25,
        description: "5 lakh chit fund plan for 25 months",
      },
      {
        planName: "STC 10 Lakhs",
        chitAmount: 1000000,
        totalMonths: 25,
        monthlySubscription: 40000,
        maxMembers: 25,
        description: "10 lakh chit fund plan for 25 months",
      },
      {
        planName: "STC 25 Lakhs",
        chitAmount: 2500000,
        totalMonths: 25,
        monthlySubscription: 100000,
        maxMembers: 25,
        description: "25 lakh chit fund plan for 25 months",
      },
    ]);

    console.log("Chit plans seeded successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedPlans();