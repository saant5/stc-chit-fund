import ChitGroup from "../models/ChitGroup.js";
// import ChitPlan from "../models/ChitPlan.js"; 
// Uncomment this if you already have ChitPlan model

export const createGroupService = async ({ groupName, planId }, userId) => {
  const ChitPlanModule = await import("../models/ChitPlan.js");
  const ChitPlan = ChitPlanModule.default;

  const plan = await ChitPlan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  const group = await ChitGroup.create({
    groupName,
    planId: plan._id,
    chitAmount: plan.chitAmount,
    durationMonths: plan.durationMonths,
    memberLimit: plan.memberLimit,
    monthlyInstallment: plan.monthlyInstallment,
    members: [
      {
        user: userId,
        role: "admin",
      },
    ],
    status: "open",
  });

  return group;
};

export const joinGroupService = async (groupId, userId) => {
  const group = await ChitGroup.findById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  if (group.status !== "open") {
    throw new Error("Group is not open for joining");
  }

  const alreadyJoined = group.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (alreadyJoined) {
    throw new Error("You already joined this group");
  }

  if (group.members.length >= group.memberLimit) {
    throw new Error("Group is already full");
  }

  group.members.push({
    user: userId,
    role: "member",
  });

  if (group.members.length === group.memberLimit) {
    group.status = "full";
  }

  await group.save();
  return group;
};

export const getOpenGroupsService = async () => {
  return await ChitGroup.find({ status: "open" })
    .populate("planId")
    .populate("members.user", "name email phone");
};

export const getMyGroupsService = async (userId) => {
  return await ChitGroup.find({
    "members.user": userId,
  })
    .populate("planId")
    .populate("members.user", "name email phone");
};

export const getGroupByIdService = async (groupId) => {
  const group = await ChitGroup.findById(groupId)
    .populate("planId")
    .populate("members.user", "name email phone");

  if (!group) {
    throw new Error("Group not found");
  }

  return group;
};