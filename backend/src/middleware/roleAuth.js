import { ApiError } from "./errorHandler.js";
import { actionRequiresVerification } from "../utils/roleCategories.js";

// Mirrors auth.js's authorize(), kept separate so multi-role routes read
// clearly as "role" concerns vs "verification" concerns. Always checks the
// user's current ACTIVE role (req.user.role), never the request body.
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };

// Gates a specific action for whichever roles are listed against it in
// ACTION_VERIFICATION_MAP. Roles/actions not in that map pass through
// untouched — this only ever adds a check, never a bypass, so it's safe to
// drop into any route without also removing the route's own authorize/requireRole.
export const requireVerifiedForAction = (action) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, "Not authorized, no token provided");

  if (actionRequiresVerification(req.user.role, action) && !req.user.isVerified) {
    throw new ApiError(
      403,
      "This action requires a verified account. Submit verification documents from your dashboard and wait for admin approval."
    );
  }
  next();
};
