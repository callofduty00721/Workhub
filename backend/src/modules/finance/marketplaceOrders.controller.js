import Payment from "../shared/payment.model.js";
import Service from "../../modules/marketplace/service.model.js";
import Application from "../shared/application.model.js";
import Contest from "../../modules/contest/contest.model.js";
import ContestEntry from "../../modules/contest/contestEntry.model.js";
import Milestone from "../jobs/milestone.model.js";
import TimeEntry from "../jobs/timeEntry.model.js";
import { getRazorpayClient, isRazorpayConfigured } from "../../config/payments.js";
import { getCommissionPercent } from "./platformSettings.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

// --- Marketplace payments (gig orders, freelance job/project hires, contest prizes) ---

async function createMarketplaceRazorpayOrder({ payer, payee, amount, type, extra = {}, receiptPrefix }) {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!amount || amount <= 0) throw new ApiError(400, "This has no payable amount set");

  const razorpay = getRazorpayClient();
  const amountInPaise = Math.round(amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `${receiptPrefix}_${payer}_${Date.now()}`,
  });

  const payment = await Payment.create({
    payer,
    payee,
    type,
    amount,
    currency: "INR",
    provider: "razorpay",
    providerOrderId: order.id,
    status: "pending",
    ...extra,
  });

  return { orderId: order.id, amount: amountInPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, paymentId: payment._id };
}

export const createGigOrderPayment = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new ApiError(404, "Gig not found");

  const freelancerId = typeof service.freelancer === "object" ? service.freelancer._id : service.freelancer;
  if (freelancerId.toString() === req.user._id.toString()) throw new ApiError(400, "You cannot order your own gig");

  const { packageName, extras } = req.body;

  let amount = service.price;
  let servicePackage;
  let deliveryDays = service.deliveryDays;
  let revisionsAllowed = service.revisions ?? 1;
  if (service.packages?.length) {
    const pkg = service.packages.find((p) => p.name === packageName);
    if (!pkg) throw new ApiError(400, "Select a valid package (Basic, Standard, or Premium)");
    amount = pkg.price;
    deliveryDays = pkg.deliveryDays;
    revisionsAllowed = pkg.revisions ?? 1;
    servicePackage = { name: pkg.name, title: pkg.title, price: pkg.price, deliveryDays: pkg.deliveryDays, revisions: pkg.revisions };
  }

  // Never trust a client-submitted price — look up each selected extra's
  // real price from the gig's own declared extras list.
  let selectedExtras;
  if (Array.isArray(extras) && extras.length) {
    const availableExtras = new Map((service.extras ?? []).map((e) => [e.label, e.price]));
    selectedExtras = extras
      .filter((e) => availableExtras.has(e?.label) && Number(e.quantity) > 0)
      .map((e) => ({ label: e.label, price: availableExtras.get(e.label), quantity: Math.min(Math.floor(Number(e.quantity)), 10) }));
    amount += selectedExtras.reduce((sum, e) => sum + e.price * e.quantity, 0);
  }

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: freelancerId,
    amount,
    type: "gig_order",
    extra: {
      service: service._id,
      note: service.title,
      ...(servicePackage && { servicePackage }),
      ...(selectedExtras?.length && { selectedExtras }),
      orderStatus: "in_progress",
      deadline: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000),
      revisionsAllowed,
    },
    receiptPrefix: "gig",
  });

  res.status(201).json({ success: true, data });
});

export const createJobHirePayment = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the job poster can pay this freelancer");
  }
  if (application.status !== "hired") throw new ApiError(400, "You can only pay a freelancer you've hired");
  if (!application.proposedRate) throw new ApiError(400, "This application has no agreed bid amount to pay");
  if (!application.contract?.employerSignedAt || !application.contract?.freelancerSignedAt) {
    throw new ApiError(400, "Both parties must sign the contract before payment can be made");
  }

  const hasMilestones = await Milestone.exists({ application: application._id });
  if (hasMilestones) {
    throw new ApiError(400, "This project has milestones set up — pay them individually instead of the full amount");
  }

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;
  const deliveryDays = application.deliveryDays || 7;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount: application.proposedRate,
    type: "job_hire",
    extra: {
      application: application._id,
      note: job.title,
      orderStatus: "in_progress",
      deadline: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000),
      revisionsAllowed: 1,
    },
    receiptPrefix: "hire",
  });

  res.status(201).json({ success: true, data });
});

// A campaign hire is simpler than a job hire — no contract-signing step and
// no milestones, since a "basic" campaign brief is a single deliverable
// paid in one shot once the brand marks the influencer as hired.
export const createCampaignPayment = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");
  if (application.onModel !== "Campaign") throw new ApiError(400, "This application is not for a campaign");

  const campaign = application.job;
  const employerId = typeof campaign.employer === "object" ? campaign.employer._id : campaign.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the campaign poster can pay this influencer");
  }
  if (application.status !== "hired") throw new ApiError(400, "You can only pay an influencer you've hired");
  if (!application.proposedRate) throw new ApiError(400, "This application has no agreed rate to pay");
  if (application.offPlatformSettledAt) throw new ApiError(400, "This hire was already settled off-platform");

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;
  const deliveryDays = application.deliveryDays || 7;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount: application.proposedRate,
    type: "campaign",
    extra: {
      application: application._id,
      note: campaign.title,
      orderStatus: "in_progress",
      deadline: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000),
      revisionsAllowed: 1,
    },
    receiptPrefix: "campaign",
  });

  res.status(201).json({ success: true, data });
});

// The brand and influencer settle the actual campaign fee between
// themselves, outside GrowHive — no escrow, no dispute protection, since the
// platform never touches that money. This payment is only the facilitation
// fee (the platform's commission on a deal it didn't process), charged as
// its own small Razorpay order.
export const createOffPlatformFacilitationPayment = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");
  if (application.onModel !== "Campaign") throw new ApiError(400, "This application is not for a campaign");

  const campaign = application.job;
  const employerId = typeof campaign.employer === "object" ? campaign.employer._id : campaign.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the campaign poster can settle this hire");
  }
  if (application.status !== "hired") throw new ApiError(400, "You can only settle an influencer you've hired");
  if (!application.proposedRate) throw new ApiError(400, "This application has no agreed rate to base the fee on");
  if (application.offPlatformSettledAt) throw new ApiError(400, "This hire was already settled off-platform");

  const existingEscrowPayment = await Payment.exists({ application: application._id, type: "campaign", status: "paid" });
  if (existingEscrowPayment) throw new ApiError(400, "This hire was already paid through GrowHive — settle new hires off-platform, not this one");

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;
  const commissionPercent = await getCommissionPercent();
  const facilitationFee = Math.round(application.proposedRate * (commissionPercent / 100));
  if (facilitationFee <= 0) throw new ApiError(400, "Facilitation fee must be a positive amount");

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount: facilitationFee,
    type: "campaign_facilitation",
    extra: { application: application._id, note: `${campaign.title} — off-platform facilitation fee` },
    receiptPrefix: "offplatform",
  });

  res.status(201).json({ success: true, data });
});

export const createMilestonePayment = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.milestoneId).populate({
    path: "application",
    populate: { path: "job" },
  });
  if (!milestone) throw new ApiError(404, "Milestone not found");
  if (milestone.status !== "pending") throw new ApiError(400, "This milestone has already been paid");

  const { application } = milestone;
  const job = application.job;
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the job poster can pay this milestone");
  }
  if (!application.contract?.employerSignedAt || !application.contract?.freelancerSignedAt) {
    throw new ApiError(400, "Both parties must sign the contract before payment can be made");
  }

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount: milestone.amount,
    type: "job_hire",
    extra: { application: application._id, milestone: milestone._id, note: `${job.title} — ${milestone.title}` },
    receiptPrefix: "milestone",
  });

  res.status(201).json({ success: true, data });
});

export const createHourlyPayment = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the job poster can pay for logged hours");
  }
  if (!application.proposedRate) throw new ApiError(400, "This application has no agreed hourly rate");
  if (!application.contract?.employerSignedAt || !application.contract?.freelancerSignedAt) {
    throw new ApiError(400, "Both parties must sign the contract before payment can be made");
  }

  const { timeEntryIds } = req.body;
  if (!Array.isArray(timeEntryIds) || timeEntryIds.length === 0) throw new ApiError(400, "Select at least one time entry to pay for");

  const entries = await TimeEntry.find({ _id: { $in: timeEntryIds }, application: application._id, billed: false });
  if (entries.length !== timeEntryIds.length) {
    throw new ApiError(400, "Some selected time entries are invalid, already billed, or don't belong to this application");
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const amount = Math.round(totalHours * application.proposedRate * 100) / 100;

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount,
    type: "job_hire",
    extra: {
      application: application._id,
      timeEntryIds: entries.map((e) => e._id),
      note: `${job.title} — ${totalHours} logged hours`,
    },
    receiptPrefix: "hourly",
  });

  res.status(201).json({ success: true, data });
});

export const createContestPrizePayment = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.contestId);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.client.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the contest poster can pay the prize");
  }

  const entry = await ContestEntry.findOne({ _id: req.params.entryId, contest: contest._id });
  if (!entry) throw new ApiError(404, "Entry not found");
  if (!entry.isWinner) throw new ApiError(400, "You can only pay the prize to the chosen winner");

  const existing = await Payment.findOne({ contest: contest._id, type: "contest_prize", status: "paid" });
  if (existing) throw new ApiError(400, "The prize for this contest has already been paid");

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: entry.freelancer,
    amount: contest.prizeAmount,
    type: "contest_prize",
    extra: { contest: contest._id, contestEntry: entry._id, note: contest.title },
    receiptPrefix: "prize",
  });

  res.status(201).json({ success: true, data });
});
