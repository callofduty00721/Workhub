import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: "" },
    priceType: { type: String, enum: ["fixed", "hourly"], default: "fixed" },
    price: { type: Number, required: true, min: 0 },
    deliveryDays: { type: Number, default: 3 },
    skills: [{ type: String }],
    images: [{ type: String }],
    status: { type: String, enum: ["active", "paused"], default: "active" },
    ordersCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ title: "text", category: "text", skills: "text" });

export default mongoose.model("Service", serviceSchema);
