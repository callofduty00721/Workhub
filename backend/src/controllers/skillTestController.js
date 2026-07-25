import SkillTest from "../models/SkillTest.js";
import SkillTestAttempt from "../models/SkillTestAttempt.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const RETAKE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const listSkillTests = asyncHandler(async (req, res) => {
  const tests = await SkillTest.find({ isActive: true }).select("skill description passingScorePercent questions").sort({ skill: 1 });

  const passedTestIds = new Set(
    (await SkillTestAttempt.find({ freelancer: req.user._id, passed: true }).select("skillTest")).map((a) => a.skillTest.toString())
  );

  const data = tests.map((t) => ({
    _id: t._id,
    skill: t.skill,
    description: t.description,
    passingScorePercent: t.passingScorePercent,
    questionCount: t.questions.length,
    passed: passedTestIds.has(t._id.toString()),
  }));

  res.json({ success: true, data });
});

export const startSkillTest = asyncHandler(async (req, res) => {
  const test = await SkillTest.findOne({ _id: req.params.id, isActive: true });
  if (!test) throw new ApiError(404, "Skill test not found");

  const lastAttempt = await SkillTestAttempt.findOne({ freelancer: req.user._id, skillTest: test._id }).sort({ createdAt: -1 });
  if (lastAttempt && Date.now() - lastAttempt.createdAt.getTime() < RETAKE_COOLDOWN_MS) {
    const hoursLeft = Math.ceil((RETAKE_COOLDOWN_MS - (Date.now() - lastAttempt.createdAt.getTime())) / (60 * 60 * 1000));
    throw new ApiError(429, `You can retake this test in ${hoursLeft} hour(s)`);
  }

  res.json({
    success: true,
    data: {
      _id: test._id,
      skill: test.skill,
      description: test.description,
      passingScorePercent: test.passingScorePercent,
      // Never send correctIndex to the client taking the test.
      questions: test.questions.map((q) => ({ question: q.question, options: q.options })),
    },
  });
});

export const submitSkillTest = asyncHandler(async (req, res) => {
  const test = await SkillTest.findOne({ _id: req.params.id, isActive: true });
  if (!test) throw new ApiError(404, "Skill test not found");

  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== test.questions.length) {
    throw new ApiError(400, "Answers must match the number of questions");
  }

  const correctCount = test.questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const scorePercent = Math.round((correctCount / test.questions.length) * 100);
  const passed = scorePercent >= test.passingScorePercent;

  await SkillTestAttempt.create({ freelancer: req.user._id, skillTest: test._id, skill: test.skill, scorePercent, passed });

  res.json({ success: true, data: { scorePercent, passed, correctCount, totalQuestions: test.questions.length } });
});

export const adminListSkillTests = asyncHandler(async (req, res) => {
  const tests = await SkillTest.find().sort({ createdAt: -1 });
  res.json({ success: true, data: tests });
});

export const createSkillTest = asyncHandler(async (req, res) => {
  const { skill, description, questions, passingScorePercent } = req.body;
  if (!skill?.trim()) throw new ApiError(400, "Skill name is required");
  if (!Array.isArray(questions) || questions.length < 3) throw new ApiError(400, "Add at least 3 questions");

  for (const q of questions) {
    if (!q.question?.trim() || !Array.isArray(q.options) || q.options.length < 2) {
      throw new ApiError(400, "Every question needs text and at least 2 options");
    }
    if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      throw new ApiError(400, `Invalid correct answer for question: "${q.question}"`);
    }
  }

  const test = await SkillTest.create({
    skill: skill.trim(),
    description: description || "",
    questions,
    passingScorePercent: passingScorePercent || 70,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: test });
});

export const updateSkillTest = asyncHandler(async (req, res) => {
  const test = await SkillTest.findById(req.params.id);
  if (!test) throw new ApiError(404, "Skill test not found");

  const { skill, description, questions, passingScorePercent, isActive } = req.body;
  if (skill !== undefined) test.skill = skill;
  if (description !== undefined) test.description = description;
  if (questions !== undefined) test.questions = questions;
  if (passingScorePercent !== undefined) test.passingScorePercent = passingScorePercent;
  if (isActive !== undefined) test.isActive = isActive;

  await test.save();
  res.json({ success: true, data: test });
});

export const deleteSkillTest = asyncHandler(async (req, res) => {
  const test = await SkillTest.findById(req.params.id);
  if (!test) throw new ApiError(404, "Skill test not found");

  await test.deleteOne();
  res.json({ success: true, message: "Skill test deleted" });
});
