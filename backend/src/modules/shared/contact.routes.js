import { Router } from "express";
import { submitContactMessage } from "./contact.controller.js";

const router = Router();

router.post("/", submitContactMessage);

export default router;
