import { z } from "zod";

export const submitSkillTestSchema = z.object({ answers: z.array(z.number().int().min(0)).min(1).max(200) }).strict();

const questionSchema = z
  .object({
    question: z.string().trim().min(1).max(2000),
    options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
    correctIndex: z.number().int().min(0),
  })
  .strict()
  .refine((q) => q.correctIndex < q.options.length, { message: "correctIndex must reference a real option", path: ["correctIndex"] });

const baseSkillTestShape = {
  skill: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  questions: z.array(questionSchema).min(3).max(100),
  passingScorePercent: z.number().min(1).max(100).optional(),
};

export const createSkillTestSchema = z.object(baseSkillTestShape).strict();
export const updateSkillTestSchema = z
  .object({ ...baseSkillTestShape, questions: baseSkillTestShape.questions.optional(), isActive: z.boolean().optional() })
  .partial()
  .strict();
