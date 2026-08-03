import Payment from "../shared/payment.model.js";
import Service from "../../modules/marketplace/service.model.js";
import Milestone from "../jobs/milestone.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { refreshFreelancerLevel } from "../../utils/freelancerLevel.js";
import { creditReferralBonusOnFirstEarning } from "../../utils/referral.js";

export const releasePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the payer can release this payment from escrow");
  }
  if (payment.status !== "paid") throw new ApiError(400, "Only completed payments can be released");
  if (payment.escrowStatus !== "held") throw new ApiError(400, "This payment is not held in escrow");

  payment.escrowStatus = "released";
  payment.releasedAt = new Date();
  await payment.save();

  if (payment.milestone) {
    await Milestone.findByIdAndUpdate(payment.milestone, { status: "released" });
  }
  refreshFreelancerLevel(payment.payee).catch(() => {});
  creditReferralBonusOnFirstEarning(payment.payee, req.app).catch(() => {});

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "Payment released to your wallet",
    message: `₹${payment.amount}${payment.note ? ` for "${payment.note}"` : ""} was approved and is now available in your wallet.`,
    link: "/dashboard/freelancer/earnings",
  });

  res.json({ success: true, data: payment });
});

// A gig_order payment's payee can be helped by any teammate on the same
// agency/Company as the gig itself — money still only ever lands in the
// original payee's wallet, but delivery/scheduling actions are collaborative.
async function isPayeeOrGigTeammate(payment, user) {
  if (payment.payee.toString() === user._id.toString()) return true;
  if (payment.type !== "gig_order" || !payment.service || !user.company) return false;
  const service = await Service.findById(payment.service).select("company");
  return !!(service?.company && service.company.toString() === user.company.toString());
}

export const deliverWork = asyncHandler(async (req, res) => {
  const { deliverables = [], note = "" } = req.body;
  if (!Array.isArray(deliverables) || deliverables.filter((d) => d.url?.trim()).length === 0) {
    throw new ApiError(400, "Add at least one deliverable link");
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (!(await isPayeeOrGigTeammate(payment, req.user))) throw new ApiError(403, "Only the freelancer can deliver this order");
  if (payment.status !== "paid") throw new ApiError(400, "This order isn't paid yet");
  if (!["in_progress", "revision_requested"].includes(payment.orderStatus)) {
    throw new ApiError(400, "This order isn't awaiting delivery");
  }

  payment.orderStatus = "delivered";
  payment.deliverables = deliverables.filter((d) => d.url?.trim()).map((d) => ({ url: d.url.trim(), name: d.name || "" }));
  payment.deliveryNote = note;
  payment.deliveredAt = new Date();
  await payment.save();

  await notify(req.app, {
    user: payment.payer,
    type: "system",
    title: "Work delivered",
    message: `Your order${payment.note ? ` for "${payment.note}"` : ""} has been delivered. Review it and accept or request a revision.`,
    link: "/dashboard/payments",
  });

  res.json({ success: true, data: payment });
});

export const acceptDelivery = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the client can accept this delivery");
  }
  if (payment.orderStatus !== "delivered") throw new ApiError(400, "This order hasn't been delivered yet");

  payment.orderStatus = "completed";
  if (payment.escrowStatus === "held") {
    payment.escrowStatus = "released";
    payment.releasedAt = new Date();
  }
  await payment.save();
  refreshFreelancerLevel(payment.payee).catch(() => {});
  creditReferralBonusOnFirstEarning(payment.payee, req.app).catch(() => {});

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "Delivery accepted — payment released",
    message: `₹${payment.amount}${payment.note ? ` for "${payment.note}"` : ""} was accepted and is now available in your wallet.`,
    link: "/dashboard/freelancer/earnings",
  });

  res.json({ success: true, data: payment });
});

export const requestRevision = asyncHandler(async (req, res) => {
  const { reason = "" } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString()) throw new ApiError(403, "Only the client can request a revision");
  if (payment.orderStatus !== "delivered") throw new ApiError(400, "This order hasn't been delivered yet");
  if (payment.revisionsAllowed !== -1 && payment.revisionsUsed >= payment.revisionsAllowed) {
    throw new ApiError(400, "No revisions left on this order — accept the delivery or raise a dispute instead");
  }

  payment.orderStatus = "revision_requested";
  payment.revisionsUsed += 1;
  payment.revisionRequestReason = reason;
  await payment.save();

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "Revision requested",
    message: `The client requested a revision on your order${payment.note ? ` for "${payment.note}"` : ""}.${reason ? ` Reason: ${reason}` : ""}`,
    link: "/dashboard/freelancer/orders",
  });

  res.json({ success: true, data: payment });
});

export const requestExtension = asyncHandler(async (req, res) => {
  const { proposedDeadline, reason = "" } = req.body;
  if (!proposedDeadline) throw new ApiError(400, "Propose a new deadline date");

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");

  const isPayer = payment.payer.toString() === req.user._id.toString();
  const isPayee = await isPayeeOrGigTeammate(payment, req.user);
  if (!isPayer && !isPayee) throw new ApiError(403, "You're not part of this order");
  if (!["in_progress", "revision_requested"].includes(payment.orderStatus)) {
    throw new ApiError(400, "This order isn't active");
  }
  if (payment.extensionRequest?.status === "pending") {
    throw new ApiError(400, "There's already a pending extension request on this order");
  }

  payment.extensionRequest = { requestedBy: req.user._id, proposedDeadline, reason, status: "pending" };
  await payment.save();

  await notify(req.app, {
    user: isPayer ? payment.payee : payment.payer,
    type: "system",
    title: "Deadline extension requested",
    message: `A new deadline of ${new Date(proposedDeadline).toLocaleDateString()} was proposed for your order${payment.note ? ` "${payment.note}"` : ""}.`,
    link: "/dashboard/payments",
  });

  res.json({ success: true, data: payment });
});

export const respondExtension = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!["approve", "reject"].includes(action)) throw new ApiError(400, "Invalid action");

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.extensionRequest?.status !== "pending") throw new ApiError(400, "There's no pending extension request on this order");
  if (payment.extensionRequest.requestedBy.toString() === req.user._id.toString()) {
    throw new ApiError(403, "You can't respond to your own extension request");
  }

  const isPayer = payment.payer.toString() === req.user._id.toString();
  const isPayee = await isPayeeOrGigTeammate(payment, req.user);
  if (!isPayer && !isPayee) throw new ApiError(403, "You're not part of this order");

  if (action === "approve") {
    payment.deadline = payment.extensionRequest.proposedDeadline;
    payment.extensionRequest.status = "approved";
  } else {
    payment.extensionRequest.status = "rejected";
  }
  await payment.save();

  await notify(req.app, {
    user: payment.extensionRequest.requestedBy,
    type: "system",
    title: action === "approve" ? "Deadline extension approved" : "Deadline extension rejected",
    message: `Your extension request${payment.note ? ` for "${payment.note}"` : ""} was ${action === "approve" ? "approved" : "rejected"}.`,
    link: "/dashboard/payments",
  });

  res.json({ success: true, data: payment });
});
