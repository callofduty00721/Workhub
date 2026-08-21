import { Router } from "express";
import { submitContactMessage } from "./contact.controller.js";
import { validate } from "../../middleware/validate.js";
import { submitContactMessageSchema } from "./contact.validation.js";

const router = Router();

router.post("/", validate(submitContactMessageSchema), submitContactMessage);

export default router;
