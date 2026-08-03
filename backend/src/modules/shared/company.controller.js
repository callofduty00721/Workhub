import Company from "./company.model.js";
import User from "./user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";

function isCompanyAdmin(company, userId) {
  if (company.owner.toString() === userId.toString()) return true;
  return company.members.some((m) => m.user.toString() === userId.toString() && m.role === "admin");
}

export const createCompany = asyncHandler(async (req, res) => {
  if (req.user.company) throw new ApiError(400, "You're already part of a company");

  const { name } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Company name is required");

  const company = await Company.create({
    name: name.trim(),
    owner: req.user._id,
    members: [{ user: req.user._id, role: "admin" }],
  });

  req.user.company = company._id;
  await req.user.save();

  res.status(201).json({ success: true, data: company });
});

export const getMyCompany = asyncHandler(async (req, res) => {
  if (!req.user.company) return res.json({ success: true, data: null });

  const company = await Company.findById(req.user.company).populate("members.user", "name avatar email headline");
  res.json({ success: true, data: company });
});

export const inviteMember = asyncHandler(async (req, res) => {
  if (!req.user.company) throw new ApiError(400, "You're not part of a company yet");

  const company = await Company.findById(req.user.company);
  if (!company) throw new ApiError(404, "Company not found");
  if (!isCompanyAdmin(company, req.user._id)) throw new ApiError(403, "Only company admins can invite members");

  const { email } = req.body;
  if (!email?.trim()) throw new ApiError(400, "Email is required");

  const invitee = await User.findOne({ email: email.trim().toLowerCase() });
  if (!invitee) throw new ApiError(404, "No account found with that email");
  // A company team is shared postings for one role at a time — an Employer's
  // team manages salaried Jobs, a Client's team manages bid-based Projects,
  // so members must share the inviter's exact role, not just "any business role".
  if (invitee.role !== req.user.role) {
    throw new ApiError(400, `Only ${req.user.role} accounts can join this team`);
  }
  if (invitee.company) throw new ApiError(400, "This user is already part of a company");

  company.members.push({ user: invitee._id, role: "member" });
  await company.save();

  invitee.company = company._id;
  await invitee.save();

  const postingType = invitee.role === "client" ? "projects" : invitee.role === "freelancer" ? "gigs" : "job postings";
  const teamLink =
    invitee.role === "client" ? "/dashboard/client/company" : invitee.role === "freelancer" ? "/dashboard/freelancer/company" : "/dashboard/employer/company";
  await notify(req.app, {
    user: invitee._id,
    type: "system",
    title: "You've joined a company team",
    message: `You were added to "${company.name}" — you can now manage its ${postingType}.`,
    link: teamLink,
  });

  const updated = await Company.findById(company._id).populate("members.user", "name avatar email headline");
  res.json({ success: true, data: updated });
});

export const removeMember = asyncHandler(async (req, res) => {
  if (!req.user.company) throw new ApiError(400, "You're not part of a company yet");

  const company = await Company.findById(req.user.company);
  if (!company) throw new ApiError(404, "Company not found");
  if (!isCompanyAdmin(company, req.user._id)) throw new ApiError(403, "Only company admins can remove members");
  if (company.owner.toString() === req.params.userId) throw new ApiError(400, "Can't remove the company owner");

  company.members = company.members.filter((m) => m.user.toString() !== req.params.userId);
  await company.save();

  await User.findByIdAndUpdate(req.params.userId, { company: null });

  const updated = await Company.findById(company._id).populate("members.user", "name avatar email headline");
  res.json({ success: true, data: updated });
});
