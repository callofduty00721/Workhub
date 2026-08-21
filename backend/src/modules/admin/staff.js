import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

// Staff accounts are exclusively super_admin-created (see auth.controller.js's
// PUBLIC_ROLE_VALUES exclusion) — there's no self-registration path, so this
// is the only place a "staff" User document ever comes into existence.
export const listStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: "staff" }).sort({ createdAt: -1 });
  res.json({ success: true, data: staff.map((u) => ({ ...u.toSafeJSON(), isBanned: u.isBanned, isDeactivated: u.isDeactivated })) });
});

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, permissions = [] } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const staff = await User.create({
    name,
    email,
    password,
    role: "staff",
    roles: ["staff"],
    staffPermissions: permissions,
    isEmailVerified: true,
  });

  res.status(201).json({ success: true, data: staff.toSafeJSON() });
});

export const updateStaffPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  const staff = await User.findById(req.params.id);
  if (!staff) throw new ApiError(404, "Staff account not found");
  if (staff.role !== "staff") throw new ApiError(400, "This account isn't a staff account");

  staff.staffPermissions = permissions;
  await staff.save();
  res.json({ success: true, data: staff.toSafeJSON() });
});
