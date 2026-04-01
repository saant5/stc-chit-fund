// server/src/seed/seedInstallments.js
const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => { console.error("DB Error:", err.message); process.exit(1); });

// Inline schemas — avoids circular import issues
const ChitPlan    = mongoose.models.ChitPlan    || mongoose.model("ChitPlan",    new mongoose.Schema({ planName:String, chitAmount:Number, totalMonths:Number, monthlySubscription:Number, maxMembers:Number, isActive:Boolean }));
const ChitGroup   = mongoose.models.ChitGroup   || mongoose.model("ChitGroup",   new mongoose.Schema({ groupName:String, planId:{type:mongoose.Schema.Types.ObjectId,ref:"ChitPlan"}, currentMonth:{type:Number,default:1}, membersJoined:{type:Number,default:0}, status:{type:String,default:"active"} }));
const ChitMember  = mongoose.models.ChitMember  || mongoose.model("ChitMember",  new mongoose.Schema({ userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, groupId:{type:mongoose.Schema.Types.ObjectId,ref:"ChitGroup"}, memberNumber:Number, status:{type:String,default:"active"}, totalPaid:{type:Number,default:0} }));
const Installment = mongoose.models.Installment || mongoose.model("Installment", new mongoose.Schema({ groupId:{type:mongoose.Schema.Types.ObjectId,ref:"ChitGroup"}, memberId:{type:mongoose.Schema.Types.ObjectId,ref:"ChitMember"}, monthNumber:Number, monthlySubscription:Number, dividend:{type:Number,default:0}, balanceSubscription:Number, dueAmount:Number, paidAmount:{type:Number,default:0}, paymentStatus:{type:String,default:"pending"}, paymentMode:{type:String,default:"—"}, referenceNumber:{type:String,default:""}, paidAt:Date }, { timestamps:true }));

mongoose.connection.once("open", async () => {
  try {
    const groups = await ChitGroup.find({ status:"active" }).populate("planId");

    if (groups.length === 0) {
      console.log("⚠  No active groups found. Create a chit group first via POST /api/chits/groups");
      process.exit(0);
    }

    let created = 0, skipped = 0;

    for (const group of groups) {
      const plan    = group.planId;
      if (!plan) continue;

      const members = await ChitMember.find({ groupId:group._id, status:"active" });
      if (members.length === 0) { console.log(`  ${group.groupName}: no members yet`); continue; }

      for (const member of members) {
        const exists = await Installment.findOne({ memberId:member._id, monthNumber:group.currentMonth });
        if (exists) { skipped++; continue; }

        const dueAmount = plan.monthlySubscription;
        await Installment.create({
          groupId:             group._id,
          memberId:            member._id,
          monthNumber:         group.currentMonth,
          monthlySubscription: plan.monthlySubscription,
          dividend:            0,
          balanceSubscription: dueAmount,
          dueAmount,
          paymentStatus:       "pending",
        });
        created++;
      }
    }

    console.log(`✅ Created ${created} installment(s), skipped ${skipped} existing.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
});