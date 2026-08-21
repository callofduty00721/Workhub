import SkillTest from "./skillTest.model.js";
import SkillTestAttempt from "./skillTestAttempt.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

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
  if (answers.length !== test.questions.length) {
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

  const test = await SkillTest.create({
    skill,
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
