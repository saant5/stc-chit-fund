// server/src/seed/seedPlans.js
const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => { console.error("DB Error:", err.message); process.exit(1); });

const ChitPlan = mongoose.models.ChitPlan || mongoose.model("ChitPlan", new mongoose.Schema({
  planName:            { type: String,  required: true },
  chitAmount:          { type: Number,  required: true },
  totalMonths:         { type: Number,  default: 25    },
  monthlySubscription: { type: Number,  required: true },
  maxMembers:          { type: Number,  default: 25    },
  description:         { type: String                  },
  isActive:            { type: Boolean, default: true  },
}, { timestamps: true }));

mongoose.connection.once("open", async () => {
  try {
    await ChitPlan.deleteMany();
    await ChitPlan.insertMany([
      { planName:"STC 5 Lakhs",  chitAmount:500000,   totalMonths:25, monthlySubscription:20000,  maxMembers:25, description:"5 lakh plan — 25 months",  isActive:true },
      { planName:"STC 10 Lakhs", chitAmount:1000000,  totalMonths:25, monthlySubscription:40000,  maxMembers:25, description:"10 lakh plan — 25 months", isActive:true },
      { planName:"STC 25 Lakhs", chitAmount:2500000,  totalMonths:25, monthlySubscription:100000, maxMembers:25, description:"25 lakh plan — 25 months", isActive:true },
    ]);
    console.log("✅ 3 chit plans seeded!");
    console.log("   STC 5L  → ₹20,000/month");
    console.log("   STC 10L → ₹40,000/month");
    console.log("   STC 25L → ₹1,00,000/month");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
});