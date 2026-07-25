import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../middleware/errorHandler.js";
import Payment from "../models/Payment.js";
import Job from "../models/Job.js";
import Project from "../models/Project.js";
import Service from "../models/Service.js";
import User from "../models/User.js";

// kycStatus/kycDocuments/kycReviewNote are deliberately NOT editable here — they
// only change via submitKyc (freelancer) and reviewKyc (admin) in kycController.js,
// so a user can't self-approve their own verification through a profile update.
const EDITABLE_FIELDS = [
  "avatar",
  "coverImage",
  "headline",
  "location",
  "bio",
  "category",
  "subCategory",
  "skills",
  "hourlyRate",
  "yearsOfExperience",
  "availabilityStatus",
  "hoursPerWeekAvailable",
  "workingDays",
  "workingHours",
  "totalHoursWorked",
  "responseTimeLabel",
  "phone",
  "resumeUrl",
  "videoIntro",
  "portfolioItems",
  "payoutDetails",
  "investmentFocus",
  "ticketSizeMin",
  "ticketSizeMax",
  "portfolioCompanyCount",
  "expertise",
  "sessionRate",
  "organizationName",
  "partnerType",
  "companyName",
  "linkedIn",
  "industries",
  "pastStartupsCount",
  "experience",
  "education",
  "achievements",
  "languages",
  "dateOfBirth",
  "nationality",
  "educationLevel",
  "roleTags",
  "lookingFor",
  "socialLinks",
];

export const updateMyProfile = asyncHandler(async (req, res) => {
  const previousResumeUrl = req.user.resumeUrl;

  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      req.user[field] = field === "portfolioItems" ? await sanitizePortfolioItems(req.body[field], req.user._id) : req.body[field];
    }
  }
  if (req.body.resumeUrl !== undefined && req.body.resumeUrl !== previousResumeUrl) {
    req.user.resumeUpdatedAt = req.body.resumeUrl ? new Date() : undefined;
  }

  req.user.isProfileComplete = true;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeJSON() });
});

// A freelancer can attach a portfolio item to a real completed payment to earn
// a "Verified" badge — but the client sends only a payment id, so we must check
// it actually belongs to this freelancer and was paid+released before trusting it.
async function sanitizePortfolioItems(items, freelancerId) {
  if (!Array.isArray(items)) return items;

  const paymentIds = items.map((item) => item.verifiedPayment).filter(Boolean);
  const validPaymentIds = paymentIds.length
    ? new Set(
        (
          await Payment.find({
            _id: { $in: paymentIds },
            payee: freelancerId,
            status: "paid",
            escrowStatus: "released",
          }).select("_id")
        ).map((p) => String(p._id))
      )
    : new Set();

  return items.map((item) => ({
    ...item,
    verifiedPayment: item.verifiedPayment && validPaymentIds.has(String(item.verifiedPayment)) ? item.verifiedPayment : null,
  }));
}

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  req.user.emailNotificationsEnabled = !!req.body.emailNotificationsEnabled;
  await req.user.save();
  res.json({ success: true, emailNotificationsEnabled: req.user.emailNotificationsEnabled });
});

export const submitKyc = asyncHandler(async (req, res) => {
  const { documents } = req.body;
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new ApiError(400, "Upload at least one document (e.g. Aadhaar, PAN, or a government ID)");
  }
  if (req.user.kycStatus === "verified") throw new ApiError(400, "You are already verified");
  if (req.user.kycStatus === "pending") throw new ApiError(400, "Your verification is already under review");

  req.user.kycDocuments = documents;
  req.user.kycStatus = "pending";
  req.user.kycSubmittedAt = new Date();
  req.user.kycReviewNote = "";
  await req.user.save();

  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const toggleSavedJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).select("_id");
  if (!job) throw new ApiError(404, "Job not found");

  const alreadySaved = req.user.savedJobs.some((id) => id.toString() === job._id.toString());
  if (alreadySaved) {
    req.user.savedJobs = req.user.savedJobs.filter((id) => id.toString() !== job._id.toString());
  } else {
    req.user.savedJobs.push(job._id);
  }
  await req.user.save();

  res.json({ success: true, data: { saved: !alreadySaved } });
});

export const toggleSavedProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).select("_id");
  if (!project) throw new ApiError(404, "Project not found");

  const alreadySaved = req.user.savedProjects.some((id) => id.toString() === project._id.toString());
  if (alreadySaved) {
    req.user.savedProjects = req.user.savedProjects.filter((id) => id.toString() !== project._id.toString());
  } else {
    req.user.savedProjects.push(project._id);
  }
  await req.user.save();

  res.json({ success: true, data: { saved: !alreadySaved } });
});

export const toggleSavedService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId).select("_id");
  if (!service) throw new ApiError(404, "Gig not found");

  const alreadySaved = req.user.savedServices.some((id) => id.toString() === service._id.toString());
  if (alreadySaved) {
    req.user.savedServices = req.user.savedServices.filter((id) => id.toString() !== service._id.toString());
  } else {
    req.user.savedServices.push(service._id);
  }
  await req.user.save();

  res.json({ success: true, data: { saved: !alreadySaved } });
});

export const getSavedItems = asyncHandler(async (req, res) => {
  const [jobs, projects, services] = await Promise.all([
    Job.find({ _id: { $in: req.user.savedJobs } }).populate("employer", "name avatar companyName").sort({ createdAt: -1 }),
    Project.find({ _id: { $in: req.user.savedProjects } }).populate("employer", "name avatar companyName").sort({ createdAt: -1 }),
    Service.find({ _id: { $in: req.user.savedServices } }).populate("freelancer", "name avatar rating reviewCount").sort({ createdAt: -1 }),
  ]);

  res.json({ success: true, data: { jobs, projects, services } });
});

export const getMyReferrals = asyncHandler(async (req, res) => {
  const referredUsers = await User.find({ referredBy: req.user._id }).select("name avatar role createdAt").sort({ createdAt: -1 });

  const referredWithStatus = await Promise.all(
    referredUsers.map(async (u) => ({
      _id: u._id,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      joinedAt: u.createdAt,
      // A referral is "credited" once the bonus has actually been paid out —
      // proxy for that is the referred user's first released payment, since
      // that's the exact moment creditReferralBonusOnFirstEarning fires.
      bonusCredited: await Payment.exists({ payee: u._id, status: "paid", escrowStatus: "released" }).then(Boolean),
    }))
  );

  res.json({
    success: true,
    data: {
      referralCode: req.user.referralCode,
      referralBonusBalance: req.user.referralBonusBalance,
      referralBonusTotal: req.user.referralBonusTotal,
      referredUsers: referredWithStatus,
    },
  });
});
