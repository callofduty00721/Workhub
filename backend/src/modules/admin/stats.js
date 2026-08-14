import User, { ROLE_VALUES } from "../shared/user.model.js";
import Startup from "../startup/startup.model.js";
import Job from "../jobs/job.model.js";
import Service from "../marketplace/service.model.js";
import Contest from "../contest/contest.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { cacheGet, cacheSet } from "../../utils/store.js";

const STATS_CACHE_KEY = "admin:platform-stats";
const STATS_CACHE_TTL_SECONDS = 60;

// Six queries (five counts + one aggregate) across the whole platform on
// every admin dashboard load/refresh — cheap individually, but this is the
// kind of number that's fine to be up to a minute stale, so it's worth
// caching rather than recomputing on every request.
export const getStats = asyncHandler(async (req, res) => {
  const cached = await cacheGet(STATS_CACHE_KEY);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

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

  const data = { totalUsers, totalStartups, totalJobs, totalServices, totalContests, roleBreakdown };
  await cacheSet(STATS_CACHE_KEY, data, STATS_CACHE_TTL_SECONDS);

  res.json({ success: true, data });
});
