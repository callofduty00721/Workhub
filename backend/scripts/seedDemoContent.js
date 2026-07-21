import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import Service from "../src/models/Service.js";
import Job from "../src/models/Job.js";
import Contest from "../src/models/Contest.js";

const DEMO_PASSWORD = "Demo@12345";

const FREELANCERS = [
  {
    name: "Aditi Kulkarni",
    email: "aditi.kulkarni@mahahub.demo",
    headline: "ग्राफिक डिझायनर आणि ब्रँड आयडेंटिटी स्पेशालिस्ट",
    bio: "मी ५ वर्षांपासून लोगो, ब्रँडिंग आणि सोशल मीडिया डिझाईनचे काम करते. स्टार्टअप्सना त्यांची व्हिज्युअल ओळख तयार करण्यात मदत करते.",
    location: "Pune, Maharashtra, India",
    skills: ["Graphic Design", "Logo Design", "Illustrator", "Branding"],
    hourlyRate: 800,
    yearsOfExperience: 5,
  },
  {
    name: "Rohan Sharma",
    email: "rohan.sharma@mahahub.demo",
    headline: "फुल-स्टैक वेब डेवलपर (React और Node.js)",
    bio: "मैं पिछले 4 सालों से React, Node.js और MongoDB के साथ वेब एप्लिकेशन बना रहा हूं। स्टार्टअप्स के लिए तेज़ और स्केलेबल प्रोडक्ट बनाना पसंद है।",
    location: "New Delhi, India",
    skills: ["React", "Node.js", "MongoDB", "TypeScript"],
    hourlyRate: 1200,
    yearsOfExperience: 4,
  },
  {
    name: "Sarah Fernandes",
    email: "sarah.fernandes@mahahub.demo",
    headline: "Content Writer & SEO Strategist",
    bio: "I help startups and small businesses tell their story through clear, engaging, and SEO-optimized content — blogs, landing pages, and product copy.",
    location: "Bengaluru, Karnataka, India",
    skills: ["Content Writing", "SEO", "Copywriting", "Blogging"],
    hourlyRate: 900,
    yearsOfExperience: 3,
  },
];

const CLIENT = {
  name: "Priya Deshmukh",
  email: "priya.deshmukh@mahahub.demo",
  headline: "Founder, MahaHub Ventures",
  companyName: "MahaHub Ventures",
  location: "Mumbai, Maharashtra, India",
};

async function upsertUser(data, role) {
  let user = await User.findOne({ email: data.email });
  if (!user) {
    user = new User({ ...data, role, password: DEMO_PASSWORD, isEmailVerified: true, isProfileComplete: true });
    await user.save();
    console.log(`Created ${role}: ${data.name}`);
  } else {
    console.log(`Reusing existing ${role}: ${data.name}`);
  }
  return user;
}

async function upsertByTitle(Model, filter, payload) {
  const existing = await Model.findOne(filter);
  if (existing) {
    console.log(`Skipping (already exists): ${filter.title}`);
    return existing;
  }
  const created = await Model.create(payload);
  console.log(`Created: ${filter.title}`);
  return created;
}

async function run() {
  await connectDB();

  const [aditi, rohan, sarah] = await Promise.all(FREELANCERS.map((f) => upsertUser(f, "freelancer")));
  const client = await upsertUser(CLIENT, "client");

  // 3 Gigs (Marathi, Hindi, English)
  await upsertByTitle(
    Service,
    { title: "व्यावसायिक लोगो आणि ब्रँड आयडेंटिटी डिझाईन करून देईन" },
    {
      freelancer: aditi._id,
      title: "व्यावसायिक लोगो आणि ब्रँड आयडेंटिटी डिझाईन करून देईन",
      description:
        "तुमच्या स्टार्टअपसाठी मी आकर्षक आणि व्यावसायिक लोगो, कलर पॅलेट आणि ब्रँड गाइडलाईन तयार करून देईन. 3 युनिक कन्सेप्ट्स आणि अमर्यादित रिव्हिजनसह.",
      category: "Graphic Design",
      priceType: "fixed",
      price: 3000,
      deliveryDays: 4,
      skills: ["Logo Design", "Branding", "Illustrator"],
    }
  );

  await upsertByTitle(
    Service,
    { title: "मैं React और Node.js में आपकी वेबसाइट बनाऊंगा" },
    {
      freelancer: rohan._id,
      title: "मैं React और Node.js में आपकी वेबसाइट बनाऊंगा",
      description:
        "मैं आपके स्टार्टअप के लिए एक तेज़, रिस्पॉन्सिव और स्केलेबल वेबसाइट React, Node.js और MongoDB का उपयोग करके बनाऊंगा, जिसमें एडमिन पैनल और API इंटीग्रेशन भी शामिल है।",
      category: "Web Development",
      priceType: "fixed",
      price: 15000,
      deliveryDays: 10,
      skills: ["React", "Node.js", "MongoDB"],
    }
  );

  await upsertByTitle(
    Service,
    { title: "I will write SEO-optimized blog content for your startup" },
    {
      freelancer: sarah._id,
      title: "I will write SEO-optimized blog content for your startup",
      description:
        "I'll research, write, and optimize engaging blog posts and landing page copy tailored to your startup's voice and target audience, with on-page SEO best practices baked in.",
      category: "Content Writing",
      priceType: "fixed",
      price: 2000,
      deliveryDays: 3,
      skills: ["Content Writing", "SEO", "Copywriting"],
    }
  );

  // 3 Projects (Job model, type=freelance, posted by the client)
  await upsertByTitle(
    Job,
    { title: "स्टार्टअपसाठी मोबाईल अॅप UI/UX डिझाईन हवे आहे" },
    {
      employer: client._id,
      title: "स्टार्टअपसाठी मोबाईल अॅप UI/UX डिझाईन हवे आहे",
      companyName: CLIENT.companyName,
      description: "आमच्या नवीन मोबाईल अॅपसाठी आम्हाला संपूर्ण UI/UX डिझाईन (Figma) हवे आहे. फूड डिलिव्हरी अॅपसारखा अनुभव अपेक्षित आहे.",
      type: "freelance",
      experienceLevel: "mid",
      skills: ["UI/UX Design", "Figma", "Mobile Design"],
      location: "Pune, Maharashtra, India",
      isRemote: true,
      salaryMin: 20000,
      salaryMax: 35000,
      currency: "INR",
      status: "open",
    }
  );

  await upsertByTitle(
    Job,
    { title: "ई-कॉमर्स वेबसाइट बनाने के लिए फ्रीलांसर चाहिए" },
    {
      employer: client._id,
      title: "ई-कॉमर्स वेबसाइट बनाने के लिए फ्रीलांसर चाहिए",
      companyName: CLIENT.companyName,
      description: "हमें एक पूर्ण ई-कॉमर्स वेबसाइट चाहिए जिसमें प्रोडक्ट कैटलॉग, कार्ट, पेमेंट गेटवे और एडमिन पैनल शामिल हो। React और Node.js में अनुभव ज़रूरी है।",
      type: "contract",
      experienceLevel: "senior",
      skills: ["React", "Node.js", "Payment Gateway"],
      location: "Remote",
      isRemote: true,
      salaryMin: 40000,
      salaryMax: 60000,
      currency: "INR",
      status: "open",
    }
  );

  await upsertByTitle(
    Job,
    { title: "Need a freelance video editor for our YouTube channel" },
    {
      employer: client._id,
      title: "Need a freelance video editor for our YouTube channel",
      companyName: CLIENT.companyName,
      description:
        "We're looking for a freelance video editor to cut, color-grade, and add captions to weekly YouTube videos for our startup's channel. Premiere Pro or DaVinci Resolve experience preferred.",
      type: "freelance",
      experienceLevel: "mid",
      skills: ["Video Editing", "Premiere Pro", "DaVinci Resolve"],
      location: "Remote",
      isRemote: true,
      salaryMin: 10000,
      salaryMax: 18000,
      currency: "INR",
      status: "open",
    }
  );

  // 3 Contests (posted by the client)
  const contestDeadline = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await upsertByTitle(
    Contest,
    { title: "आमच्या स्टार्टअपसाठी लोगो डिझाईन स्पर्धा" },
    {
      client: client._id,
      title: "आमच्या स्टार्टअपसाठी लोगो डिझाईन स्पर्धा",
      description: "आम्हाला आमच्या नवीन स्टार्टअपसाठी एक आधुनिक आणि लक्षवेधी लोगो हवा आहे. सर्वोत्तम एन्ट्रीला बक्षीस दिले जाईल.",
      category: "Graphic Design",
      skills: ["Logo Design", "Branding"],
      prizeAmount: 5000,
      currency: "INR",
      deadline: contestDeadline(14),
      status: "open",
    }
  );

  await upsertByTitle(
    Contest,
    { title: "हमारे ऐप के लिए टैगलाइन प्रतियोगिता" },
    {
      client: client._id,
      title: "हमारे ऐप के लिए टैगलाइन प्रतियोगिता",
      description: "हमें अपने नए ऐप के लिए एक आकर्षक और यादगार टैगलाइन चाहिए जो हमारे ब्रांड की पहचान को दर्शाए। विजेता को नकद पुरस्कार मिलेगा।",
      category: "Copywriting",
      skills: ["Copywriting", "Branding"],
      prizeAmount: 3000,
      currency: "INR",
      deadline: contestDeadline(10),
      status: "open",
    }
  );

  await upsertByTitle(
    Contest,
    { title: "Design a landing page mockup for our SaaS product" },
    {
      client: client._id,
      title: "Design a landing page mockup for our SaaS product",
      description:
        "We're looking for a clean, modern landing page mockup (Figma) for our upcoming SaaS product launch. The winning design will be used for our public launch page.",
      category: "UI/UX Design",
      skills: ["UI/UX Design", "Figma", "Landing Page"],
      prizeAmount: 8000,
      currency: "INR",
      deadline: contestDeadline(21),
      status: "open",
    }
  );

  console.log("\nDemo seed complete.");
  console.log(`Demo login password for all seeded accounts: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
