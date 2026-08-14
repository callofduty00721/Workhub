import Grievance from "../shared/grievance.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

export const listGrievances = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Grievance.find(filter)
      .populate("resolvedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Grievance.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

// Acknowledge just timestamps that someone's looked at it (the IT Rules 2021
// clock admins need to watch — 24h to acknowledge). Resolve requires a note
// so there's a record of how it was handled, and is idempotent-safe since a
// resolved grievance can't be re-resolved from a stale UI state.
export const updateGrievanceStatus = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  if (!["acknowledge", "resolve"].includes(action)) throw new ApiError(400, "Invalid action");

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) throw new ApiError(404, "Grievance not found");

  if (action === "acknowledge") {
    if (grievance.status !== "open") throw new ApiError(400, "This grievance has already been acknowledged");
    grievance.status = "acknowledged";
    grievance.acknowledgedAt = new Date();
  } else {
    if (grievance.status === "resolved") throw new ApiError(400, "This grievance has already been resolved");
    if (!note?.trim()) throw new ApiError(400, "A resolution note is required");
    grievance.status = "resolved";
    grievance.resolvedAt = new Date();
    grievance.adminNote = note.trim();
    grievance.resolvedBy = req.user._id;
    if (!grievance.acknowledgedAt) grievance.acknowledgedAt = new Date();
  }

  await grievance.save();
  res.json({ success: true, data: grievance });
});
