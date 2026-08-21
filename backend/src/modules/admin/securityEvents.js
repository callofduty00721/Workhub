import SecurityEvent from "../shared/securityEvent.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

// The forensic trail /admin/activity doesn't cover — that one is "which
// staff member reviewed/resolved what" (reviewedBy/processedBy fields on
// existing documents); this is "who tried to log in, from where, and did it
// work" — the record that lets a super_admin actually investigate a
// suspected account-takeover attempt after the fact instead of only seeing
// the rate limiter's ephemeral counters.
export const listSecurityEvents = asyncHandler(async (req, res) => {
  const { type, email, startDate, endDate } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (email) filter.email = email.toLowerCase().trim();
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = startDate;
    // endDate arrives as midnight (start of that day) after z.coerce.date() —
    // push it to the end of that day so the filter includes events that
    // happened any time on the selected end date, not just before midnight.
    if (endDate) filter.createdAt.$lte = new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });

  const [items, total] = await Promise.all([
    SecurityEvent.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    SecurityEvent.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: paginationMeta(pageNum, limitNum, total) });
});
