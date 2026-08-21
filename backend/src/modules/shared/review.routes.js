import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listReviews, createReview, deleteReview } from "./review.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listReviewsQuerySchema, createReviewSchema } from "./review.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listReviewsQuerySchema, "query"), listReviews);
router.post("/", protect, validate(createReviewSchema), createReview);
router.delete("/:id", protect, deleteReview);

export default router;
