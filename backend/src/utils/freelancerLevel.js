import Payment from "../models/Payment.js";
import User from "../models/User.js";

// Stats a public profile can actually back with real platform data, rather
// than trusting self-reported numbers — jobsCompleted/repeatClients/jobSuccess
// are all derived from this freelancer's own Payment history.
export async function computeFreelancerStats(freelancerId) {
  const payments = await Payment.find({ payee: freelancerId, status: "paid" }).select(
    "payer type application escrowStatus disputeStatus netAmount deadline deliveredAt"
  );

  const released = payments.filter((p) => p.escrowStatus === "released");
  const disputedOrRefunded = payments.filter((p) => p.disputeStatus === "raised" || p.disputeStatus === "refunded");

  // Collapse milestone payments sharing the same application into one "job",
  // and count each gig order as its own completed job.
  const completedJobKeys = new Set(released.map((p) => (p.application ? `app:${p.application}` : `pay:${p._id}`)));

  const payerCounts = new Map();
  for (const p of released) {
    const payerId = String(p.payer);
    payerCounts.set(payerId, (payerCounts.get(payerId) || 0) + 1);
  }
  const uniqueClients = payerCounts.size;
  const repeatClients = [...payerCounts.values()].filter((count) => count > 1).length;

  const totalEngagements = payments.length;
  const jobSuccessPercent = totalEngagements === 0 ? 100 : Math.round(((totalEngagements - disputedOrRefunded.length) / totalEngagements) * 100);

  // Only gig_order and non-milestone job_hire payments carry a deadline —
  // milestone payments release on the client's own approval, with no fixed
  // due date, so they're excluded rather than counted as always "on time".
  const withDeadline = payments.filter((p) => p.deadline && p.deliveredAt);
  const deliveredOnTime = withDeadline.filter((p) => p.deliveredAt <= p.deadline);
  const onTimeDeliveryPercent =
    withDeadline.length === 0 ? 0 : Math.round((deliveredOnTime.length / withDeadline.length) * 100);

  return {
    jobsCompleted: completedJobKeys.size,
    totalEarnings: released.reduce((sum, p) => sum + (p.netAmount || 0), 0),
    repeatClientsPercent: uniqueClients === 0 ? 0 : Math.round((repeatClients / uniqueClients) * 100),
    jobSuccessPercent,
    onTimeDeliveryPercent,
  };
}

// Level is derived the same way jobsCompleted/jobSuccessPercent are — from
// real payment history, not self-reported — so it can't be gamed by editing
// a profile field. Thresholds are a starting point, not tuned against real
// marketplace data yet.
export function computeFreelancerLevel({ jobsCompleted, jobSuccessPercent }, accountCreatedAt) {
  const accountAgeDays = (Date.now() - new Date(accountCreatedAt).getTime()) / (24 * 60 * 60 * 1000);

  if (jobsCompleted >= 30 && jobSuccessPercent >= 95 && accountAgeDays >= 90) return "top_rated";
  if (jobsCompleted >= 5 && jobSuccessPercent >= 85 && accountAgeDays >= 30) return "level_1";
  return "new";
}

// Recomputes and persists a freelancer's cached level so it can be filtered
// on cheaply in list queries — called whenever an action changes their stats
// (escrow release, dispute resolution) rather than on every profile view.
export async function refreshFreelancerLevel(freelancerId) {
  const user = await User.findById(freelancerId).select("createdAt role");
  if (!user || user.role !== "freelancer") return;

  const stats = await computeFreelancerStats(freelancerId);
  const level = computeFreelancerLevel(stats, user.createdAt);
  await User.findByIdAndUpdate(freelancerId, { level, onTimeDeliveryPercent: stats.onTimeDeliveryPercent });
}
