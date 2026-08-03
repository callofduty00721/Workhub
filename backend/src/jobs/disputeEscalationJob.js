import Payment from "../modules/shared/payment.model.js";
import User from "../modules/shared/user.model.js";
import { notify } from "../utils/notify.js";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const ESCALATE_AFTER_DAYS = 5;

// Doesn't auto-refund — a stale dispute just gets flagged urgent and pushed to
// every admin's notifications, so a human still makes the actual money call.
export async function escalateStaleDisputes(app) {
  const cutoff = new Date(Date.now() - ESCALATE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const stale = await Payment.find({
    disputeStatus: "raised",
    disputeEscalated: false,
    disputeRaisedAt: { $lte: cutoff },
  });

  if (!stale.length) return;

  const admins = await User.find({ role: "super_admin" }).select("_id");
  if (!admins.length) return;

  for (const payment of stale) {
    payment.disputeEscalated = true;
    await payment.save();

    await Promise.all(
      admins.map((admin) =>
        notify(app, {
          user: admin._id,
          type: "system",
          title: "Dispute needs attention — unresolved past the response window",
          message: `A dispute on a ₹${payment.amount} payment${payment.note ? ` for "${payment.note}"` : ""} has been open for ${ESCALATE_AFTER_DAYS}+ days without resolution.`,
          link: "/dashboard/admin/payments",
        })
      )
    );
  }
}

export function startDisputeEscalationJob(app) {
  const run = () => {
    escalateStaleDisputes(app).catch((err) => console.error("Dispute escalation job failed:", err.message));
  };

  run();
  setInterval(run, CHECK_INTERVAL_MS);
}
