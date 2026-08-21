import User from "../shared/user.model.js";
import Startup from "../startup/startup.model.js";
import Job from "../jobs/job.model.js";
import Project from "../jobs/project.model.js";
import Service from "../marketplace/service.model.js";
import Contest from "../contest/contest.model.js";
import ContestEntry from "../contest/contestEntry.model.js";
import Investment from "../startup/investment.model.js";
import Payment from "../shared/payment.model.js";
import Withdrawal from "../finance/withdrawal.model.js";
import Application from "../shared/application.model.js";
import Milestone from "../jobs/milestone.model.js";
import TimeEntry from "../jobs/timeEntry.model.js";
import Company from "../shared/company.model.js";
import Pitch from "../startup/pitch.model.js";
import TeamApplication from "../startup/teamApplication.model.js";
import Discussion from "../startup/discussion.model.js";
import DiscussionComment from "../startup/discussionComment.model.js";
import StartupUpdate from "../startup/startupUpdate.model.js";
import SkillTest from "../marketplace/skillTest.model.js";
import SkillTestAttempt from "../marketplace/skillTestAttempt.model.js";
import Session from "../mentorship/session.model.js";
import Review from "../shared/review.model.js";
import Subscription from "../finance/subscription.model.js";
import Alert from "../productivity/alert.model.js";
import Notification from "../shared/notification.model.js";
import JobAccessLog from "../shared/jobAccessLog.model.js";
import Message from "../chat/message.model.js";
import Conversation from "../chat/conversation.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status === "banned") filter.isBanned = true;
  else if (status === "deactivated") filter.isDeactivated = true;
  else if (status === "active") {
    filter.isBanned = false;
    filter.isDeactivated = false;
  }
  if (search) {
    filter.$or = [{ name: safeSearchRegex(search) }, { email: safeSearchRegex(search) }];
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items.map((u) => ({ ...u.toSafeJSON(), isBanned: u.isBanned, isDeactivated: u.isDeactivated })),
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const toggleBanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "super_admin") throw new ApiError(400, "Cannot ban a super admin");

  user.isBanned = !user.isBanned;
  await user.save();
  res.json({ success: true, isBanned: user.isBanned });
});

// The only way isDeactivated ever turns false again — authController's
// deactivateAccount tells the user to "contact support to reactivate it",
// so this is that support action. Deliberately one-directional (admin can
// only undo a self-deactivation, not deactivate someone on the user's behalf
// — that's what banning is for).
export const reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.isDeactivated) throw new ApiError(400, "This account isn't deactivated");

  user.isDeactivated = false;
  await user.save();
  res.json({ success: true, isDeactivated: user.isDeactivated });
});

// True cascading hard delete — the User document and every document that
// belongs to them (or references them) is actually removed, not just wiped.
// Chosen deliberately over anonymize-in-place after weighing the tradeoff:
// this leaves NO orphaned references (unlike a bare User.findByIdAndDelete),
// but it is real, permanent data loss — including Payments/Withdrawals, which
// most platforms keep for accounting/legal reasons. There is no undo.
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "super_admin") throw new ApiError(400, "Cannot delete a super admin");

  const userId = user._id;

  // 1. Listings this user owns — gather ids before deleting so we can cascade
  // into everything that points at those listings.
  const [ownedJobs, ownedProjects, ownedStartups, ownedContests, ownedCompany] = await Promise.all([
    Job.find({ employer: userId }).select("_id"),
    Project.find({ employer: userId }).select("_id"),
    Startup.find({ founder: userId }).select("_id"),
    Contest.find({ client: userId }).select("_id"),
    Company.findOne({ owner: userId }).select("_id"),
  ]);
  const jobIds = ownedJobs.map((j) => j._id);
  const projectIds = ownedProjects.map((p) => p._id);
  const jobAndProjectIds = [...jobIds, ...projectIds];
  const startupIds = ownedStartups.map((s) => s._id);
  const contestIds = ownedContests.map((c) => c._id);

  // 2. Applications against those listings (both directions: applications
  // the user filed themselves, and applications filed against their listings)
  // plus everything that hangs off an Application.
  const [applicationsToOwnedListings, applicationsByUser] = await Promise.all([
    Application.find({ job: { $in: jobAndProjectIds } }).select("_id"),
    Application.find({ applicant: userId }).select("_id"),
  ]);
  const allApplicationIds = [...applicationsToOwnedListings, ...applicationsByUser].map((a) => a._id);
  if (allApplicationIds.length) {
    await Promise.all([
      Milestone.deleteMany({ application: { $in: allApplicationIds } }),
      TimeEntry.deleteMany({ application: { $in: allApplicationIds } }),
      Application.deleteMany({ _id: { $in: allApplicationIds } }),
    ]);
  }

  // 3. Everything hanging off the user's own startups.
  const discussionsOnOwnedStartups = startupIds.length ? await Discussion.find({ startup: { $in: startupIds } }).select("_id") : [];
  const discussionIds = discussionsOnOwnedStartups.map((d) => d._id);
  await Promise.all([
    discussionIds.length ? DiscussionComment.deleteMany({ discussion: { $in: discussionIds } }) : null,
    discussionIds.length ? Discussion.deleteMany({ _id: { $in: discussionIds } }) : null,
    startupIds.length ? StartupUpdate.deleteMany({ startup: { $in: startupIds } }) : null,
    startupIds.length ? Investment.deleteMany({ startup: { $in: startupIds } }) : null,
    startupIds.length ? Pitch.deleteMany({ startup: { $in: startupIds } }) : null,
    startupIds.length ? TeamApplication.deleteMany({ startup: { $in: startupIds } }) : null,
    contestIds.length ? ContestEntry.deleteMany({ contest: { $in: contestIds } }) : null,
    jobIds.length ? JobAccessLog.deleteMany({ job: { $in: jobIds } }) : null,
  ]);

  // 4. Delete the owned listings themselves, and this user's own comment/like
  // trail as an author (not just as an owner of something else).
  await Promise.all([
    jobIds.length ? Job.deleteMany({ _id: { $in: jobIds } }) : null,
    projectIds.length ? Project.deleteMany({ _id: { $in: projectIds } }) : null,
    startupIds.length ? Startup.deleteMany({ _id: { $in: startupIds } }) : null,
    contestIds.length ? Contest.deleteMany({ _id: { $in: contestIds } }) : null,
    Discussion.deleteMany({ author: userId }),
    DiscussionComment.deleteMany({ author: userId }),
  ]);

  // 5. Company membership — delete it if they owned it (after moving members
  // off it so their `company` field doesn't dangle), otherwise just remove
  // them from whichever company they belong to as a plain member.
  if (ownedCompany) {
    await User.updateMany({ company: ownedCompany._id }, { company: null });
    await Company.deleteOne({ _id: ownedCompany._id });
  } else {
    await Company.updateMany({ "members.user": userId }, { $pull: { members: { user: userId } } });
  }

  // 6. Records where this user is the actor rather than the listing owner.
  const ownedServices = await Service.find({ freelancer: userId }).select("_id");
  const serviceIds = ownedServices.map((s) => s._id);
  await Promise.all([
    TeamApplication.deleteMany({ applicant: userId }),
    ContestEntry.deleteMany({ freelancer: userId }),
    SkillTestAttempt.deleteMany({ freelancer: userId }),
    Investment.deleteMany({ investor: userId }),
    Pitch.deleteMany({ $or: [{ founder: userId }, { investor: userId }] }),
    Session.deleteMany({ $or: [{ mentor: userId }, { requester: userId }] }),
    Review.deleteMany({ $or: [{ reviewer: userId }, { targetType: "user", targetId: userId }] }),
    Service.deleteMany({ freelancer: userId }),
    Withdrawal.deleteMany({ freelancer: userId }),
    Payment.deleteMany({ $or: [{ payer: userId }, { payee: userId }] }),
    Subscription.deleteMany({ user: userId }),
    Alert.deleteMany({ user: userId }),
    Notification.deleteMany({ user: userId }),
    SkillTest.updateMany({ createdBy: userId }, { createdBy: null }),
  ]);

  // 7. Messages/conversations — delete what they sent, then drop them from
  // any conversation; a conversation left with fewer than 2 people is dead.
  await Message.deleteMany({ sender: userId });
  await Message.updateMany({ readBy: userId }, { $pull: { readBy: userId } });
  await Conversation.updateMany({ participants: userId }, { $pull: { participants: userId } });
  const emptiedConversations = await Conversation.find({ participants: { $size: 0 } }).select("_id");
  const oneLeftConversations = await Conversation.find({ participants: { $size: 1 } }).select("_id");
  const deadConversationIds = [...emptiedConversations, ...oneLeftConversations].map((c) => c._id);
  if (deadConversationIds.length) {
    await Promise.all([
      Message.deleteMany({ conversation: { $in: deadConversationIds } }),
      Conversation.deleteMany({ _id: { $in: deadConversationIds } }),
    ]);
  }

  // 8. Prune this user's id out of every array field on other people's
  // documents — likes, follows, invites, NDA acceptances, saved items.
  await Promise.all([
    Startup.updateMany(
      {},
      { $pull: { followers: userId, interested: userId, reports: { user: userId } } }
    ),
    Discussion.updateMany({}, { $pull: { likes: userId, reports: { user: userId } } }),
    StartupUpdate.updateMany({}, { $pull: { likes: userId } }),
    Job.updateMany({}, { $pull: { invitedFreelancers: userId, ndaAcceptances: { user: userId } } }),
    Project.updateMany({}, { $pull: { invitedFreelancers: userId, ndaAcceptances: { user: userId } } }),
    User.updateMany(
      {},
      {
        $pull: {
          followers: userId,
          savedJobs: { $in: jobIds },
          savedProjects: { $in: projectIds },
          savedServices: { $in: serviceIds },
        },
      }
    ),
  ]);

  // 9. The user document itself, last — everything above assumed it still existed.
  await User.deleteOne({ _id: userId });

  res.json({ success: true, message: "Account and all associated records permanently deleted." });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  user.role = role;
  // super_admin has no role category and can't hold other roles alongside
  // it — clear the leftover multi-role state so the frontend role switcher
  // doesn't offer to "switch back" to whatever role this account used to be.
  if (role === "super_admin") {
    user.roles = ["super_admin"];
    user.selectedCategory = null;
  }
  await user.save();
  res.json({ success: true, data: user.toSafeJSON() });
});
