import { z } from "zod";
import { objectIdString } from "../../validation/common.js";

// Every other field in this controller (amount, deadline, etc.) is computed
// server-side from trusted DB records (service.price, application.proposedRate,
// milestone.amount, contest.prizeAmount) — never taken from the client — so
// these two endpoints are the only real client-input surface in
// marketplaceOrders.controller.js. packageName/extras are still cross-checked
// against the gig's own declared packages/extras after this (never trusted as
// a price), but the shape itself should be rejected up front if it's wrong.
export const createGigOrderPaymentSchema = z
  .object({
    packageName: z.string().trim().max(100).optional(),
    extras: z
      .array(z.object({ label: z.string().trim().max(200), quantity: z.number().int().positive() }).strict())
      .max(20)
      .optional(),
  })
  .strict();

export const createHourlyPaymentSchema = z
  .object({ timeEntryIds: z.array(objectIdString("time entry id")).min(1) })
  .strict();
