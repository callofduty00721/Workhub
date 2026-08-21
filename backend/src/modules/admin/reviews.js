import Review from "../shared/review.model.js";
import User from "../shared/user.model.js";
import Service from "../marketplace/service.model.js";
import Startup from "../startup/startup.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const TARGET_MODELS = { user: User, service: Service, startup: Startup };
const TARGET_LABEL_FIELD = { user: "name", service: "title", startup: "name" };

export const listReviews = asyncHandler(async (req, res) => {
  const { targetType, rating } = req.query;

  const filter = {};
  if (targetType) filter.targetType = targetType;
  if (rating) filter.rating = Number(rating);

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Review.find(filter).populate("reviewer", "name email avatar").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Review.countDocuments(filter),
  ]);

  // targetId is polymorphic (user/service/startup) with no refPath, so it
  // can't be populated directly — resolve a display label per group of ids
  // actually present on this page, one query per target type instead of one
  // query per row.
  const idsByType = { user: new Set(), service: new Set(), startup: new Set() };
  for (const review of items) idsByType[review.targetType]?.add(review.targetId.toString());

  const labelMaps = await Promise.all(
    Object.entries(idsByType).map(async ([type, idSet]) => {
      if (idSet.size === 0) return [type, new Map()];
      const Model = TARGET_MODELS[type];
      const field = TARGET_LABEL_FIELD[type];
      const docs = await Model.find({ _id: { $in: [...idSet] } }).select(field);
      return [type, new Map(docs.map((d) => [d._id.toString(), d[field]]))];
    })
  );
  const labelMapByType = Object.fromEntries(labelMaps);

  const data = items.map((review) => ({
    ...review.toObject(),
    targetLabel: labelMapByType[review.targetType]?.get(review.targetId.toString()) ?? null,
  }));

  res.json({ success: true, data, pagination: paginationMeta(pageNum, limitNum, total) });
});
