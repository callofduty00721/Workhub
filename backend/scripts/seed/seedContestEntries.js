import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import Contest from "../../src/modules/contest/contest.model.js";
import ContestEntry from "../../src/modules/contest/contestEntry.model.js";

const ENTRIES = [
  {
    freelancerEmail: "aditi.kulkarni@growhive.demo",
    contestTitle: "आमच्या स्टार्टअपसाठी लोगो डिझाईन स्पर्धा",
    title: "मिनिमल आणि मॉडर्न लोगो कन्सेप्ट",
    description: "मी तुमच्या स्टार्टअपसाठी एक मिनिमल, स्केलेबल आणि सहज लक्षात राहणारा लोगो डिझाईन केला आहे. यात एक क्लीन आयकॉन आणि दोन कलर व्हेरियंट समाविष्ट आहेत.",
  },
  {
    freelancerEmail: "sarah.fernandes@growhive.demo",
    contestTitle: "हमारे ऐप के लिए टैगलाइन प्रतियोगिता",
    title: "Catchy & Memorable Tagline Concepts",
    description: "I've put together 5 short, punchy tagline options that capture your app's core value proposition — each tested for clarity and recall.",
  },
  {
    freelancerEmail: "rohan.sharma@growhive.demo",
    contestTitle: "Design a landing page mockup for our SaaS product",
    title: "Clean SaaS Landing Page Wireframe",
    description: "A clean, conversion-focused landing page wireframe with a clear hero section, feature highlights, and a strong call-to-action — built with your launch goals in mind.",
  },
];

async function run() {
  assertNotProduction("seedContestEntries");
  await connectDB();

  for (const entry of ENTRIES) {
    const freelancer = await User.findOne({ email: entry.freelancerEmail });
    const contest = await Contest.findOne({ title: entry.contestTitle });
    if (!freelancer || !contest) {
      console.log(`Skipping "${entry.title}" — freelancer or contest not found. Run seedDemoContent.js first.`);
      continue;
    }

    const existing = await ContestEntry.findOne({ contest: contest._id, freelancer: freelancer._id });
    if (existing) {
      console.log(`Skipping (already exists): ${entry.title}`);
      continue;
    }

    await ContestEntry.create({
      contest: contest._id,
      freelancer: freelancer._id,
      title: entry.title,
      description: entry.description,
    });
    await Contest.findByIdAndUpdate(contest._id, { $inc: { entriesCount: 1 } });
    console.log(`Created entry: ${entry.title}`);
  }

  console.log("\nContest entries seed complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
