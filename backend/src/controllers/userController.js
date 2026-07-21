import { asyncHandler } from "../middleware/asyncHandler.js";

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
  "portfolioItems",
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
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  }

  req.user.isProfileComplete = true;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeJSON() });
});
