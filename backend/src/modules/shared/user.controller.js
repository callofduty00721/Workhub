import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/errorHandler.js";
import Payment from "./payment.model.js";
import Job from "../jobs/job.model.js";
import Project from "../jobs/project.model.js";
import Service from "../marketplace/service.model.js";
import Contest from "../contest/contest.model.js";
import User from "./user.model.js";
import { getPhoneAuthProvider } from "../finance/platformSettings.model.js";
import { verifyFirebasePhoneIdToken } from "../../utils/firebaseAuth.js";
import { startTwilioVerification, checkTwilioVerification } from "../../utils/twilioVerify.js";

// User.phone is stored as a bare 10-digit number (see registerSchema's
// `^\d{10}$` regex) — there's no separate country-code field, so every
// number is assumed Indian for SMS purposes.
const toE164 = (phone) => `+91${phone}`;

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
  "fundName",
  "fundSize",
  "preferredStages",
  "expertise",
  "sessionRate",
  "sessionFormat",
  "organizationName",
  "partnerType",
  "programDetails",
  "startupsSupportedCount",
  "applicationLink",
  "companyName",
  "companySize",
  "companyRegistrationNumber",
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
  "jobSeekerProfile",
  "influencerProfile",
  "founderStage",
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

// Only the Twilio path uses this pair (send code / check code) — Firebase
// phone auth is driven entirely client-side (see verifyPhoneFirebaseToken).
export const sendPhoneOtp = asyncHandler(async (req, res) => {
  if (!req.user.phone) throw new ApiError(400, "Add a phone number to your profile first");
  if (req.user.isPhoneVerified) throw new ApiError(400, "Your mobile number is already verified");

  const provider = await getPhoneAuthProvider();
  if (provider !== "twilio") {
    throw new ApiError(503, "Phone verification isn't available right now");
  }

  await startTwilioVerification(toE164(req.user.phone));
  res.json({ success: true, message: "We texted a verification code to your phone." });
});

export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(400, "Enter the code you received");

  const provider = await getPhoneAuthProvider();
  if (provider !== "twilio") {
    throw new ApiError(503, "Phone verification isn't available right now");
  }

  const approved = await checkTwilioVerification(toE164(req.user.phone), String(otp));
  if (!approved) throw new ApiError(400, "Incorrect or expired code");

  req.user.isPhoneVerified = true;
  await req.user.save();

  res.json({ success: true, user: req.user.toSafeJSON() });
});

// Firebase's phone auth flow (reCAPTCHA + signInWithPhoneNumber +
// confirmationResult.confirm(code)) happens entirely in the browser — the
// backend's only job is to verify the resulting ID token really is a phone
// sign-in, and that the number matches this account, before flipping the flag.
export const verifyPhoneFirebaseToken = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new ApiError(400, "Missing verification token");
  if (!req.user.phone) throw new ApiError(400, "Add a phone number to your profile first");

  const provider = await getPhoneAuthProvider();
  if (provider !== "firebase") {
    throw new ApiError(503, "Phone verification isn't available right now");
  }

  let phoneNumber;
  try {
    ({ phoneNumber } = await verifyFirebasePhoneIdToken(idToken));
  } catch {
    throw new ApiError(401, "Verification failed — try again");
  }

  if (phoneNumber !== toE164(req.user.phone)) {
    throw new ApiError(400, "That code was for a different phone number than the one on your profile");
  }

  req.user.isPhoneVerified = true;
  await req.user.save();

  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const submitFaceVerification = asyncHandler(async (req, res) => {
  const { selfieUrl } = req.body;
  if (!selfieUrl) throw new ApiError(400, "Upload a clear selfie photo");
  if (req.user.faceVerificationStatus === "verified") throw new ApiError(400, "You are already verified");
  if (req.user.faceVerificationStatus === "pending") throw new ApiError(400, "Your verification is already under review");

  req.user.faceVerificationSelfie = selfieUrl;
  req.user.faceVerificationStatus = "pending";
  req.user.faceVerificationSubmittedAt = new Date();
  req.user.faceVerificationReviewNote = "";
  await req.user.save();

  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const submitAddressVerification = asyncHandler(async (req, res) => {
  const { documents } = req.body;
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new ApiError(400, "Upload at least one address proof (utility bill, rental agreement, bank statement)");
  }
  if (req.user.addressVerificationStatus === "verified") throw new ApiError(400, "You are already verified");
  if (req.user.addressVerificationStatus === "pending") throw new ApiError(400, "Your verification is already under review");

  req.user.addressVerificationDocuments = documents;
  req.user.addressVerificationStatus = "pending";
  req.user.addressVerificationSubmittedAt = new Date();
  req.user.addressVerificationReviewNote = "";
  await req.user.save();

  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const submitBankVerification = asyncHandler(async (req, res) => {
  const { documents } = req.body;
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new ApiError(400, "Upload a cancelled cheque, passbook photo, or bank statement");
  }
  if (req.user.bankVerificationStatus === "verified") throw new ApiError(400, "You are already verified");
  if (req.user.bankVerificationStatus === "pending") throw new ApiError(400, "Your verification is already under review");

  req.user.bankVerificationDocuments = documents;
  req.user.bankVerificationStatus = "pending";
  req.user.bankVerificationSubmittedAt = new Date();
  req.user.bankVerificationReviewNote = "";
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

export const toggleSavedFreelancer = asyncHandler(async (req, res) => {
  const freelancer = await User.findOne({ _id: req.params.freelancerId, role: "freelancer" }).select("_id");
  if (!freelancer) throw new ApiError(404, "Freelancer not found");

  const alreadySaved = req.user.savedFreelancers.some((id) => id.toString() === freelancer._id.toString());
  if (alreadySaved) {
    req.user.savedFreelancers = req.user.savedFreelancers.filter((id) => id.toString() !== freelancer._id.toString());
  } else {
    req.user.savedFreelancers.push(freelancer._id);
  }
  await req.user.save();

  res.json({ success: true, data: { saved: !alreadySaved } });
});

export const toggleSavedContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.contestId).select("_id");
  if (!contest) throw new ApiError(404, "Contest not found");

  const alreadySaved = req.user.savedContests.some((id) => id.toString() === contest._id.toString());
  if (alreadySaved) {
    req.user.savedContests = req.user.savedContests.filter((id) => id.toString() !== contest._id.toString());
  } else {
    req.user.savedContests.push(contest._id);
  }
  await req.user.save();

  res.json({ success: true, data: { saved: !alreadySaved } });
});

export const getSavedItems = asyncHandler(async (req, res) => {
  const [jobs, projects, services, freelancers, contests] = await Promise.all([
    Job.find({ _id: { $in: req.user.savedJobs } }).populate("employer", "name avatar companyName").sort({ createdAt: -1 }),
    Project.find({ _id: { $in: req.user.savedProjects } }).populate("employer", "name avatar companyName").sort({ createdAt: -1 }),
    Service.find({ _id: { $in: req.user.savedServices } }).populate("freelancer", "name avatar rating reviewCount").sort({ createdAt: -1 }),
    User.find({ _id: { $in: req.user.savedFreelancers } }).select("name avatar headline category rating reviewCount hourlyRate level"),
    Contest.find({ _id: { $in: req.user.savedContests } }).populate("client", "name avatar companyName").sort({ createdAt: -1 }),
  ]);

  res.json({ success: true, data: { jobs, projects, services, freelancers, contests } });
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
