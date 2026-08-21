import { z } from "zod";
import { objectIdString } from "../../validation/common.js";

export const getOrCreateConversationSchema = z.object({ userId: objectIdString("userId") }).strict();

const attachmentSchema = z
  .object({
    url: z.string().trim().min(1).max(2048),
    name: z.string().max(255).optional(),
    type: z.enum(["image", "video", "file"]),
    size: z.number().min(0).optional(),
  })
  .strict();

export const sendMessageSchema = z
  .object({
    text: z.string().max(10000).optional(),
    attachments: z.array(attachmentSchema).max(5).optional(),
  })
  .strict()
  .refine((d) => !!d.text?.trim() || (d.attachments?.length ?? 0) > 0, {
    message: "Message text or an attachment is required",
    path: ["text"],
  });
