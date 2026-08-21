import { z } from "zod";

export const raiseDisputeSchema = z.object({ reason: z.string().trim().min(1).max(2000) }).strict();

const withdrawalAmount = z.number().positive().max(10_000_000);

// Discriminated on `method` so the upi/bank-specific fields are only
// required (and only accepted — .strict() on each branch) for the method
// they actually belong to, rather than one big object where every field is
// "optional" and the real requirement lives only in controller-side ifs.
export const requestWithdrawalSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("upi"), amount: withdrawalAmount, upiId: z.string().trim().min(1).max(100) }).strict(),
  z
    .object({
      method: z.literal("bank"),
      amount: withdrawalAmount,
      bankAccountNumber: z.string().trim().min(1).max(34),
      bankIfsc: z.string().trim().min(1).max(11),
      bankAccountHolder: z.string().trim().min(1).max(200),
    })
    .strict(),
]);
