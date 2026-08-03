import User, { ROLE_VALUES } from "../shared/user.model.js";
import Startup from "../startup/startup.model.js";
import Job from "../jobs/job.model.js";
import Service from "../marketplace/service.model.js";
import Contest from "../contest/contest.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalStartups, totalJobs, totalServices, totalContests, usersByRole] = await Promise.all([
    User.countDocuments(),
    Startup.countDocuments(),
    Job.countDocuments(),
    Service.countDocuments(),
    Contest.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);

  const roleBreakdown = ROLE_VALUES.reduce((acc, role) => {
    acc[role] = usersByRole.find((r) => r._id === role)?.count || 0;
    return acc;
  }, {});

  res.json({
    success: true,
    data: { totalUsers, totalStartups, totalJobs, totalServices, totalContests, roleBreakdown },
  });
});
