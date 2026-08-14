import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import Project from "../../src/modules/jobs/project.model.js";
import Service from "../../src/modules/marketplace/service.model.js";
import Contest from "../../src/modules/contest/contest.model.js";
import Job from "../../src/modules/jobs/job.model.js";

const DEMO_PASSWORD = "Demo@12345";

const avatarUrl = (seed) => `https://i.pravatar.cc/300?u=${seed}`;
const coverUrl = (seed) => `https://picsum.photos/seed/${seed}/1200/400`;

const FREELANCERS = [
  {
    name: "Aditi Kulkarni",
    email: "aditi.kulkarni@growhive.demo",
    headline: "Graphic Designer & Brand Identity Specialist",
    bio: "5 years designing logos, branding, and social media creatives for startups.",
    location: "Pune, Maharashtra, India",
    category: "Graphics & Design",
    subCategory: "Logo Design",
    skills: ["Graphic Design", "Logo Design", "Illustrator", "Branding"],
    hourlyRate: 800,
    yearsOfExperience: 5,
    availabilityStatus: "available",
    avatar: avatarUrl("aditi-kulkarni"),
    coverImage: coverUrl("aditi-kulkarni-cover"),
  },
  {
    name: "Rohan Sharma",
    email: "rohan.sharma@growhive.demo",
    headline: "Full-Stack Web Developer (React & Node.js)",
    bio: "4 years building fast, scalable web apps with React, Node.js, and MongoDB for startups.",
    location: "New Delhi, India",
    category: "Programming & Tech",
    subCategory: "Full-Stack Development",
    skills: ["React", "Node.js", "MongoDB", "TypeScript"],
    hourlyRate: 1200,
    yearsOfExperience: 4,
    availabilityStatus: "available",
    avatar: avatarUrl("rohan-sharma"),
    coverImage: coverUrl("rohan-sharma-cover"),
  },
  {
    name: "Sarah Fernandes",
    email: "sarah.fernandes@growhive.demo",
    headline: "Content Writer & SEO Strategist",
    bio: "I help startups and small businesses tell their story through clear, engaging, SEO-optimized content.",
    location: "Bengaluru, Karnataka, India",
    category: "Writing & Translation",
    subCategory: "Blog Writing",
    skills: ["Content Writing", "SEO", "Copywriting", "Blogging"],
    hourlyRate: 900,
    yearsOfExperience: 3,
    availabilityStatus: "available",
    avatar: avatarUrl("sarah-fernandes"),
    coverImage: coverUrl("sarah-fernandes-cover"),
  },
];

const CLIENT = {
  name: "Priya Deshmukh",
  email: "priya.deshmukh@growhive.demo",
  headline: "Founder, GrowHive Ventures",
  companyName: "GrowHive Ventures",
  location: "Mumbai, Maharashtra, India",
  avatar: avatarUrl("priya-deshmukh"),
  coverImage: coverUrl("priya-deshmukh-cover"),
};

const EMPLOYER = {
  name: "Vikram Joshi",
  email: "vikram.joshi@growhive.demo",
  headline: "HR Manager, TechNova Solutions",
  companyName: "TechNova Solutions",
  location: "Bengaluru, Karnataka, India",
  avatar: avatarUrl("vikram-joshi"),
  coverImage: coverUrl("vikram-joshi-cover"),
};

async function upsertUser(data, role) {
  let user = await User.findOne({ email: data.email });
  if (!user) {
    user = new User({ ...data, role, password: DEMO_PASSWORD, isEmailVerified: true, isProfileComplete: true });
    await user.save();
    console.log(`Created ${role}: ${data.name}`);
  } else {
    Object.assign(user, data);
    await user.save();
    console.log(`Updated existing ${role}: ${data.name}`);
  }
  return user;
}

async function upsertByTitle(Model, filter, payload) {
  const label = filter.title;
  const existing = await Model.findOne(filter);
  if (existing) {
    await Model.updateOne({ _id: existing._id }, { $set: payload });
    console.log(`Updated: ${label}`);
    return existing;
  }
  const created = await Model.create(payload);
  console.log(`Created: ${label}`);
  return created;
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function run() {
  assertNotProduction("seedSampleSixTypes");
  await connectDB();

  const [aditi, rohan, sarah] = await Promise.all(FREELANCERS.map((f) => upsertUser(f, "freelancer")));
  const client = await upsertUser(CLIENT, "client");
  const employer = await upsertUser(EMPLOYER, "employer");

  // 3 Gigs (Service model)
  await upsertByTitle(
    Service,
    { title: "I will design a professional logo and brand identity" },
    {
      freelancer: aditi._id,
      title: "I will design a professional logo and brand identity",
      description:
        "I'll create an eye-catching, professional logo, color palette, and brand guideline for your startup. 3 unique concepts with unlimited revisions.",
      category: "Graphic Design",
      priceType: "fixed",
      price: 3000,
      deliveryDays: 4,
      skills: ["Logo Design", "Branding", "Illustrator"],
      experienceLevel: "expert",
      status: "active",
      images: [coverUrl("gig-logo-design-1"), coverUrl("gig-logo-design-2")],
      packages: [
        { name: "basic", title: "Basic Logo", description: "2 logo concepts with final files.", price: 3000, deliveryDays: 4, revisions: 2, features: ["2 logo concepts", "PNG + JPG files", "2 revisions"] },
        { name: "standard", title: "Logo + Brand Kit", description: "Logo plus full color palette and font guide.", price: 6000, deliveryDays: 6, revisions: 4, features: ["3 logo concepts", "Color palette + font guide", "Social media kit", "4 revisions"] },
        { name: "premium", title: "Complete Branding", description: "Full brand identity — logo, guidelines, and stationery design.", price: 12000, deliveryDays: 10, revisions: 8, features: ["5 logo concepts", "Full brand guideline", "Business card + letterhead design", "Unlimited revisions"] },
      ],
    }
  );

  await upsertByTitle(
    Service,
    { title: "I will build your website with React and Node.js" },
    {
      freelancer: rohan._id,
      title: "I will build your website with React and Node.js",
      description:
        "I'll build a fast, responsive, scalable website for your startup using React, Node.js, and MongoDB, including an admin panel and API integrations.",
      category: "Web Development",
      priceType: "fixed",
      price: 15000,
      deliveryDays: 10,
      skills: ["React", "Node.js", "MongoDB"],
      experienceLevel: "intermediate",
      status: "active",
      images: [coverUrl("gig-webdev-1"), coverUrl("gig-webdev-2")],
      packages: [
        { name: "basic", title: "Landing Page", description: "One responsive landing page.", price: 15000, deliveryDays: 10, revisions: 2, features: ["1-page responsive website", "Basic SEO setup", "Mobile friendly"] },
        { name: "standard", title: "Multi-Page Website", description: "Full website with admin panel.", price: 25000, deliveryDays: 14, revisions: 3, features: ["Up to 5 pages", "Admin panel", "API integration"] },
        { name: "premium", title: "Full Web App", description: "Complete web app with database and support.", price: 45000, deliveryDays: 21, revisions: 5, features: ["Full web app", "Database design", "3 months of support"] },
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
      experienceLevel: "intermediate",
      status: "active",
      images: [coverUrl("gig-content-1"), coverUrl("gig-content-2")],
      packages: [
        { name: "basic", title: "1 Blog Post", description: "A single well-researched, SEO-optimized blog post.", price: 2000, deliveryDays: 3, revisions: 1, features: ["800-1000 word blog post", "Basic SEO keywords", "1 revision"] },
        { name: "standard", title: "4 Blog Posts", description: "A month's worth of blog content.", price: 7000, deliveryDays: 7, revisions: 2, features: ["4 blog posts (800-1000 words each)", "SEO keyword optimization", "2 rounds of edits"] },
        { name: "premium", title: "Content Package", description: "Full content package including landing page copy.", price: 15000, deliveryDays: 14, revisions: 3, features: ["8 blog posts + landing page copy", "Full SEO keyword research", "Priority delivery"] },
      ],
    }
  );

  // 3 Projects (Project model - bid-based freelance work posted by the client)
  await upsertByTitle(
    Project,
    { title: "Mobile app UI/UX design needed for our startup" },
    {
      employer: client._id,
      title: "Mobile app UI/UX design needed for our startup",
      companyName: CLIENT.companyName,
      description:
        "We need a complete UI/UX design (Figma) for our new mobile app. Looking for a food-delivery-app-like experience — clean, modern, and intuitive.",
      requirements: "Portfolio of shipped mobile app designs, strong Figma skills, understanding of iOS/Android design guidelines.",
      type: "freelance",
      category: "Design",
      subCategory: "UI/UX Design",
      skills: ["UI/UX Design", "Figma", "Mobile Design"],
      location: "Pune, Maharashtra, India",
      isRemote: true,
      budgetMin: 20000,
      budgetMax: 35000,
      expectedDeliveryDays: 21,
      currency: "INR",
      status: "open",
    }
  );

  await upsertByTitle(
    Project,
    { title: "Build an e-commerce website with payment integration" },
    {
      employer: client._id,
      title: "Build an e-commerce website with payment integration",
      companyName: CLIENT.companyName,
      description:
        "We need a full e-commerce website with product catalog, cart, payment gateway, and admin panel. Experience with React and Node.js is essential.",
      requirements: "3+ years of e-commerce development experience, prior payment gateway integrations (Razorpay/Stripe).",
      type: "contract",
      category: "Development",
      subCategory: "Web Development",
      skills: ["React", "Node.js", "Payment Gateway"],
      location: "Remote",
      isRemote: true,
      budgetMin: 40000,
      budgetMax: 60000,
      expectedDeliveryDays: 30,
      currency: "INR",
      status: "open",
    }
  );

  await upsertByTitle(
    Project,
    { title: "Freelance video editor needed for our YouTube channel" },
    {
      employer: client._id,
      title: "Freelance video editor needed for our YouTube channel",
      companyName: CLIENT.companyName,
      description:
        "Looking for a freelance video editor to cut, color-grade, and caption weekly YouTube videos for our startup's channel. Premiere Pro or DaVinci Resolve experience preferred.",
      requirements: "Portfolio of edited YouTube content, quick turnaround, comfort with weekly delivery cadence.",
      type: "freelance",
      category: "Video & Animation",
      subCategory: "Video Editing",
      skills: ["Video Editing", "Premiere Pro", "DaVinci Resolve"],
      location: "Remote",
      isRemote: true,
      budgetMin: 10000,
      budgetMax: 18000,
      expectedDeliveryDays: 7,
      currency: "INR",
      status: "open",
    }
  );

  // 3 Jobs (Job model - salaried employment posted by the employer)
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
      category: "IT & Software",
      experienceLevel: "mid",
      skills: ["React", "TypeScript", "Tailwind CSS"],
      location: "Bengaluru, Karnataka, India",
      isRemote: false,
      openings: 2,
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
      category: "Design",
      experienceLevel: "entry",
      skills: ["Graphic Design", "Illustrator", "Figma"],
      location: "Pune, Maharashtra, India",
      isRemote: true,
      openings: 1,
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
      category: "Marketing",
      experienceLevel: "entry",
      skills: ["Social Media", "Content Writing", "Analytics"],
      location: "Mumbai, Maharashtra, India",
      isRemote: false,
      openings: 3,
      salaryMin: 8000,
      salaryMax: 12000,
      currency: "INR",
      status: "open",
    }
  );

  // 3 Contests (posted by the client)
  await upsertByTitle(
    Contest,
    { title: "Logo design contest for our startup" },
    {
      client: client._id,
      title: "Logo design contest for our startup",
      description: "We want a modern, memorable logo for our new startup. Best entry wins the prize.",
      category: "Graphic Design",
      skills: ["Logo Design", "Branding"],
      prizeAmount: 5000,
      currency: "INR",
      deadline: daysFromNow(14),
      status: "open",
    }
  );

  await upsertByTitle(
    Contest,
    { title: "Tagline contest for our app" },
    {
      client: client._id,
      title: "Tagline contest for our app",
      description: "We need a catchy, memorable tagline for our new app that captures our brand identity. Winner gets a cash prize.",
      category: "Copywriting",
      skills: ["Copywriting", "Branding"],
      prizeAmount: 3000,
      currency: "INR",
      deadline: daysFromNow(10),
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
      deadline: daysFromNow(21),
      status: "open",
    }
  );

  console.log("\nSeed complete: 3 freelancers, 3 projects, 3 gigs, 3 contests, 3 jobs.");
  console.log(`Demo login password for all seeded accounts: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
