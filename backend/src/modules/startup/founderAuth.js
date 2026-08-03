import { ApiError } from "../../middleware/errorHandler.js";

// Every founder-only action on a startup (or something hanging off one — an
// update, a discussion, an investment, a team application, a pitch) should
// also let super_admin override, same as every other ownership check in the
// app. Centralized here so that guarantee can't drift per-controller again.
export function assertStartupFounder(startup, user, message = "Only the founder can perform this action") {
  const isFounder = startup.founder.toString() === user._id.toString();
  const isAdmin = user.role === "super_admin";
  if (!isFounder && !isAdmin) throw new ApiError(403, message);
}
