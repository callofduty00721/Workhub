import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import Service from "../../src/modules/marketplace/service.model.js";
import Job from "../../src/modules/jobs/job.model.js";
import Contest from "../../src/modules/contest/contest.model.js";
import SkillTest from "../../src/modules/marketplace/skillTest.model.js";

const DEMO_PASSWORD = "Demo@12345";

const FREELANCERS = [
  {
    name: "Aditi Kulkarni",
    email: "aditi.kulkarni@growhive.demo",
    headline: "ग्राफिक डिझायनर आणि ब्रँड आयडेंटिटी स्पेशालिस्ट",
    bio: "मी ५ वर्षांपासून लोगो, ब्रँडिंग आणि सोशल मीडिया डिझाईनचे काम करते. स्टार्टअप्सना त्यांची व्हिज्युअल ओळख तयार करण्यात मदत करते.",
    location: "Pune, Maharashtra, India",
    skills: ["Graphic Design", "Logo Design", "Illustrator", "Branding"],
    hourlyRate: 800,
    yearsOfExperience: 5,
  },
  {
    name: "Rohan Sharma",
    email: "rohan.sharma@growhive.demo",
    headline: "फुल-स्टैक वेब डेवलपर (React और Node.js)",
    bio: "मैं पिछले 4 सालों से React, Node.js और MongoDB के साथ वेब एप्लिकेशन बना रहा हूं। स्टार्टअप्स के लिए तेज़ और स्केलेबल प्रोडक्ट बनाना पसंद है।",
    location: "New Delhi, India",
    skills: ["React", "Node.js", "MongoDB", "TypeScript"],
    hourlyRate: 1200,
    yearsOfExperience: 4,
  },
  {
    name: "Sarah Fernandes",
    email: "sarah.fernandes@growhive.demo",
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
  email: "priya.deshmukh@growhive.demo",
  headline: "Founder, GrowHive Ventures",
  companyName: "GrowHive Ventures",
  location: "Mumbai, Maharashtra, India",
};

const EMPLOYER = {
  name: "Vikram Joshi",
  email: "vikram.joshi@growhive.demo",
  headline: "HR Manager, TechNova Solutions",
  companyName: "TechNova Solutions",
  location: "Bengaluru, Karnataka, India",
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
  const label = filter.title ?? filter.skill ?? JSON.stringify(filter);
  const existing = await Model.findOne(filter);
  if (existing) {
    console.log(`Skipping (already exists): ${label}`);
    return existing;
  }
  const created = await Model.create(payload);
  console.log(`Created: ${label}`);
  return created;
}

async function run() {
  assertNotProduction("seedDemoContent");
  await connectDB();

  const [aditi, rohan, sarah] = await Promise.all(FREELANCERS.map((f) => upsertUser(f, "freelancer")));
  const client = await upsertUser(CLIENT, "client");
  const employer = await upsertUser(EMPLOYER, "employer");

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
      packages: [
        {
          name: "basic",
          title: "Basic Logo",
          description: "2 लोगो कन्सेप्ट्स, फायनल फाईल्ससह.",
          price: 3000,
          deliveryDays: 4,
          revisions: 2,
          features: ["2 लोगो कन्सेप्ट्स", "PNG + JPG फाईल्स", "2 रिव्हिजन"],
        },
        {
          name: "standard",
          title: "Logo + Brand Kit",
          description: "लोगो सोबत संपूर्ण कलर पॅलेट आणि फॉन्ट गाइड.",
          price: 6000,
          deliveryDays: 6,
          revisions: 4,
          features: ["3 लोगो कन्सेप्ट्स", "कलर पॅलेट + फॉन्ट गाइड", "सोशल मीडिया किट", "4 रिव्हिजन"],
        },
        {
          name: "premium",
          title: "Complete Branding",
          description: "संपूर्ण ब्रँड आयडेंटिटी — लोगो, गाइडलाईन आणि स्टेशनरी डिझाईन.",
          price: 12000,
          deliveryDays: 10,
          revisions: 8,
          features: ["5 लोगो कन्सेप्ट्स", "संपूर्ण ब्रँड गाइडलाईन", "बिझनेस कार्ड + लेटरहेड डिझाईन", "अमर्यादित रिव्हिजन"],
        },
      ],
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
      packages: [
        {
          name: "basic",
          title: "Landing Page",
          description: "एक रिस्पॉन्सिव लैंडिंग पेज।",
          price: 15000,
          deliveryDays: 10,
          revisions: 2,
          features: ["1 पेज रिस्पॉन्सिव वेबसाइट", "बेसिक SEO सेटअप", "मोबाइल फ्रेंडली"],
        },
        {
          name: "standard",
          title: "Multi-Page Website",
          description: "एडमिन पैनल के साथ पूरी वेबसाइट।",
          price: 25000,
          deliveryDays: 14,
          revisions: 3,
          features: ["5 पेज तक वेबसाइट", "एडमिन पैनल", "API इंटीग्रेशन"],
        },
        {
          name: "premium",
          title: "Full Web App",
          description: "डेटाबेस और सपोर्ट के साथ पूरा वेब ऐप।",
          price: 45000,
          deliveryDays: 21,
          revisions: 5,
          features: ["पूरा वेब ऐप", "डेटाबेस डिज़ाइन", "3 महीने का सपोर्ट"],
        },
      ],
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
      packages: [
        {
          name: "basic",
          title: "1 Blog Post",
          description: "A single well-researched, SEO-optimized blog post.",
          price: 2000,
          deliveryDays: 3,
          revisions: 1,
          features: ["800-1000 word blog post", "Basic SEO keywords", "1 revision"],
        },
        {
          name: "standard",
          title: "4 Blog Posts",
          description: "A month's worth of blog content.",
          price: 7000,
          deliveryDays: 7,
          revisions: 2,
          features: ["4 blog posts (800-1000 words each)", "SEO keyword optimization", "2 rounds of edits"],
        },
        {
          name: "premium",
          title: "Content Package",
          description: "Full content package including landing page copy.",
          price: 15000,
          deliveryDays: 14,
          revisions: 3,
          features: ["8 blog posts + landing page copy", "Full SEO keyword research", "Priority delivery"],
        },
      ],
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

  // 3 Jobs (Job model, type=full_time/part_time/internship, posted by the employer)
  await upsertByTitle(
    Job,
    { title: "Frontend Developer" },
    {
      employer: employer._id,
      title: "Frontend Developer",
      companyName: EMPLOYER.companyName,
      description:
        "TechNova Solutions is hiring a Frontend Developer to build and maintain our customer-facing React applications. You'll work closely with our design and backend teams to ship polished, performant UI.",
      responsibilities: "Build reusable React components, collaborate with designers, optimize app performance, write tests.",
      requirements: "2+ years with React and TypeScript, strong CSS fundamentals, experience with REST APIs.",
      type: "full_time",
      experienceLevel: "mid",
      skills: ["React", "TypeScript", "Tailwind CSS"],
      location: "Bengaluru, Karnataka, India",
      isRemote: false,
      salaryMin: 45000,
      salaryMax: 70000,
      currency: "INR",
      status: "open",
    }
  );

  await upsertByTitle(
    Job,
    { title: "Part-Time Graphic Designer" },
    {
      employer: employer._id,
      title: "Part-Time Graphic Designer",
      companyName: EMPLOYER.companyName,
      description:
        "We're looking for a part-time graphic designer to support our marketing team with social media creatives, presentation decks, and occasional print materials.",
      responsibilities: "Design social media graphics, presentation templates, and marketing collateral on a weekly basis.",
      requirements: "Proficiency in Illustrator/Photoshop or Figma, a strong portfolio, ability to turn around requests quickly.",
      type: "part_time",
      experienceLevel: "entry",
      skills: ["Graphic Design", "Illustrator", "Figma"],
      location: "Pune, Maharashtra, India",
      isRemote: true,
      salaryMin: 15000,
      salaryMax: 25000,
      currency: "INR",
      status: "open",
    }
  );

  await upsertByTitle(
    Job,
    { title: "Marketing Intern" },
    {
      employer: employer._id,
      title: "Marketing Intern",
      companyName: EMPLOYER.companyName,
      description:
        "Join TechNova Solutions as a Marketing Intern and get hands-on experience running social media campaigns, writing content, and analyzing campaign performance.",
      responsibilities: "Assist with social media scheduling, write short-form content, track campaign metrics.",
      requirements: "Currently pursuing or recently completed a degree in marketing, communications, or a related field.",
      type: "internship",
      experienceLevel: "entry",
      skills: ["Social Media", "Content Writing", "Analytics"],
      location: "Mumbai, Maharashtra, India",
      isRemote: false,
      salaryMin: 8000,
      salaryMax: 12000,
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

  // 3 Skill Tests
  await upsertByTitle(
    SkillTest,
    { skill: "React" },
    {
      skill: "React",
      description: "Tests core React concepts — components, hooks, and state management.",
      passingScorePercent: 70,
      createdBy: employer._id,
      questions: [
        { question: "Which hook is used to manage state in a functional component?", options: ["useEffect", "useState", "useRef", "useMemo"], correctIndex: 1 },
        { question: "What does JSX compile down to?", options: ["HTML", "React.createElement calls", "CSS-in-JS", "WebAssembly"], correctIndex: 1 },
        { question: "Which hook runs a side effect after render?", options: ["useState", "useCallback", "useEffect", "useContext"], correctIndex: 2 },
        { question: "How do you prevent a component from re-rendering unnecessarily?", options: ["React.memo", "useState", "JSX.Fragment", "props.children"], correctIndex: 0 },
        { question: "What is the correct way to update state based on the previous state?", options: ["setState(state + 1)", "setState(prev => prev + 1)", "state = state + 1", "this.state++"], correctIndex: 1 },
      ],
    }
  );

  await upsertByTitle(
    SkillTest,
    { skill: "Content Writing" },
    {
      skill: "Content Writing",
      description: "Tests fundamentals of clear, SEO-aware content writing.",
      passingScorePercent: 70,
      createdBy: employer._id,
      questions: [
        { question: "What is the primary goal of a meta description?", options: ["Improve page load speed", "Summarize the page to encourage clicks in search results", "Add keywords invisibly", "Replace the page title"], correctIndex: 1 },
        { question: "What is 'readability' in content writing primarily concerned with?", options: ["Word count", "How easy the text is to read and understand", "Number of images", "Font size"], correctIndex: 1 },
        { question: "What's a good practice for headings in a long article?", options: ["Avoid headings entirely", "Use one giant paragraph", "Break content into scannable H2/H3 sections", "Bold every sentence"], correctIndex: 2 },
        { question: "What does 'keyword stuffing' refer to?", options: ["A recommended SEO technique", "Overusing a keyword unnaturally, which hurts readability and SEO", "Writing long-form content", "Using synonyms for variety"], correctIndex: 1 },
        { question: "What is a call-to-action (CTA)?", options: ["A legal disclaimer", "A prompt encouraging the reader to take a specific action", "A type of heading", "A citation format"], correctIndex: 1 },
      ],
    }
  );

  await upsertByTitle(
    SkillTest,
    { skill: "Graphic Design" },
    {
      skill: "Graphic Design",
      description: "Tests core visual design principles.",
      passingScorePercent: 70,
      createdBy: employer._id,
      questions: [
        { question: "What is the color model used for print design?", options: ["RGB", "CMYK", "HEX", "HSL"], correctIndex: 1 },
        { question: "What does 'white space' refer to in design?", options: ["Only literally white-colored areas", "Empty space around elements that improves clarity", "A design mistake", "The background layer"], correctIndex: 1 },
        { question: "Which file format supports transparency and is common for web graphics?", options: ["JPEG", "PNG", "BMP", "TIFF"], correctIndex: 1 },
        { question: "What is 'kerning' in typography?", options: ["Line spacing", "The space between individual letter pairs", "Font weight", "Paragraph alignment"], correctIndex: 1 },
        { question: "What is the standard resolution for high-quality print design?", options: ["72 DPI", "150 DPI", "300 DPI", "1080 DPI"], correctIndex: 2 },
      ],
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
