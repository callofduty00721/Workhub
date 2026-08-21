import Plan from "../finance/plan.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const listPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find().sort({ role: 1, tier: 1 });
  res.json({ success: true, data: plans });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { name, priceInInr, priceInInrYearly, features, maxListings } = req.body;

  const plan = await Plan.findById(req.params.id);
  if (!plan) throw new ApiError(404, "Plan not found");

  if (name !== undefined) plan.name = name;
  if (priceInInr !== undefined) plan.priceInInr = priceInInr;
  if (priceInInrYearly !== undefined) plan.priceInInrYearly = priceInInrYearly;
  if (features !== undefined) plan.features = features;
  if (maxListings !== undefined) plan.maxListings = maxListings;

  await plan.save();
  res.json({ success: true, data: plan });
});
