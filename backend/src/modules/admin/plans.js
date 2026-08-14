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

  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, "Name can't be empty");
    plan.name = name.trim();
  }
  if (priceInInr !== undefined) {
    if (typeof priceInInr !== "number" || priceInInr < 0) throw new ApiError(400, "Price must be 0 or more");
    plan.priceInInr = priceInInr;
  }
  if (priceInInrYearly !== undefined) {
    if (typeof priceInInrYearly !== "number" || priceInInrYearly < 0) throw new ApiError(400, "Yearly price must be 0 or more");
    plan.priceInInrYearly = priceInInrYearly;
  }
  if (features !== undefined) {
    if (!Array.isArray(features)) throw new ApiError(400, "Features must be a list");
    plan.features = features.map((f) => String(f).trim()).filter(Boolean);
  }
  if (maxListings !== undefined) {
    if (typeof maxListings !== "number" || (maxListings < 0 && maxListings !== -1)) {
      throw new ApiError(400, "Max listings must be -1 (unlimited) or 0 or more");
    }
    plan.maxListings = maxListings;
  }

  await plan.save();
  res.json({ success: true, data: plan });
});
