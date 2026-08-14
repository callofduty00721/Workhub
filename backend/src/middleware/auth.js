import User from "../modules/shared/user.model.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { ApiError } from "./errorHandler.js";
import { asyncHandler } from "./asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const token = header.split(" ")[1];
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Not authorized, token invalid or expired");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "Not authorized, user no longer exists");
  if (user.isBanned) throw new ApiError(403, "This account has been suspended");
  if (user.isDeactivated) throw new ApiError(403, "This account has been deactivated. Contact support to reactivate it.");

  req.user = user;
  next();
});

// Populates req.user when a valid token is present, but never rejects the
// request if it's missing or invalid — for routes that are public but behave
// differently for a logged-in (or specific) user, e.g. hiding private data.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  try {
    const payload = verifyAccessToken(header.split(" ")[1]);
    const user = await User.findById(payload.sub);
    if (user && !user.isBanned && !user.isDeactivated) req.user = user;
  } catch {
    // ignore invalid/expired tokens — request proceeds unauthenticated
  }

  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };

// For admin-panel routes a super_admin-created "staff" account can be scoped
// into (see user.model.js's PERMISSIONS list). super_admin always passes —
// its access was never meant to depend on the staffPermissions array, only a
// staff account's is. Mount after authorize("super_admin", "staff") so
// req.user.role is already known to be one of those two.
export const requirePermission =
  (permission) =>
  (req, res, next) => {
    if (req.user.role === "super_admin") return next();
    if (req.user.role === "staff" && req.user.staffPermissions?.includes(permission)) return next();
    throw new ApiError(403, "You do not have permission to perform this action");
  };
