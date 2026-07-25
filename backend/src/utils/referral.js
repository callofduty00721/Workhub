import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { notify } from "./notify.js";

export const REFERRAL_BONUS_INR = 100;

// Credits the referrer a flat bonus the first time their referred freelancer
// earns a released payment. Called after a payment's escrowStatus flips to
// "released" and is saved, so counting released payments for this payee
// tells us whether this is their first — never credits twice for the same
// referred user.
export async function creditReferralBonusOnFirstEarning(payeeId, app) {
  const payee = await User.findById(payeeId).select("referredBy");
  if (!payee?.referredBy) return;

  const releasedCount = await Payment.countDocuments({ payee: payeeId, status: "paid", escrowStatus: "released" });
  if (releasedCount !== 1) return;

  const referrer = await User.findByIdAndUpdate(payee.referredBy, {
    $inc: { referralBonusBalance: REFERRAL_BONUS_INR, referralBonusTotal: REFERRAL_BONUS_INR },
  });
  if (!referrer) return;

  await notify(app, {
    user: referrer._id,
    type: "system",
    title: "Referral bonus earned!",
    message: `Someone you referred just completed their first paid job — you earned ₹${REFERRAL_BONUS_INR} in referral credit.`,
    link: "/dashboard/referrals",
  });
}
