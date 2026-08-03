import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import User from "../../src/modules/shared/user.model.js";
import Startup from "../../src/modules/startup/startup.model.js";

const FOUNDER_EMAIL = "founder.demo@mahahub.test";
const FOUNDER_PASSWORD = "Demo@12345";

const FOUNDER_PROFILE_FIELDS = {
  headline: "Serial founder building rural-first businesses",
  location: "Nanded, Maharashtra",
  bio: "Building startups that solve everyday problems for rural India. I believe technology and fair trade can transform rural livelihoods.",
  linkedIn: "https://linkedin.com/in/rameshpatil",
  industries: ["Agriculture", "Education", "Clean Energy"],
  skills: ["Leadership", "Business Strategy", "Fundraising", "Team Building", "Rural Development"],
  yearsOfExperience: 10,
  pastStartupsCount: 3,
  experience: [
    {
      title: "Founder & CEO",
      company: "गायमित्र दूध डेअरी",
      location: "Nanded, Maharashtra",
      startLabel: "Jan 2025",
      endLabel: "Present",
      description: "Building a direct farmer-to-consumer dairy supply chain across Marathwada.",
    },
    {
      title: "Agribusiness Consultant",
      company: "Freelance",
      location: "Maharashtra",
      startLabel: "2016",
      endLabel: "Dec 2024",
      description: "Advised rural cooperatives on supply chain and market access.",
    },
  ],
  education: [
    { degree: "B.Sc. Agriculture", institution: "Vasantrao Naik Marathwada Krishi Vidyapeeth, Parbhani", startLabel: "2010", endLabel: "2014" },
  ],
  achievements: [
    { title: "Recognized by Startup India", dateLabel: "2025" },
    { title: "Incubated at Krishi Innovation Cell", dateLabel: "2024" },
  ],
  languages: ["Marathi", "Hindi", "English"],
  dateOfBirth: new Date("1990-05-12"),
  nationality: "Indian",
  educationLevel: "Graduate",
  roleTags: ["Entrepreneur", "Rural Innovator"],
  lookingFor: ["Investor", "Mentor", "Strategic Partner"],
};

async function getOrCreateFounder() {
  let founder = await User.findOne({ email: FOUNDER_EMAIL });
  if (founder) {
    Object.assign(founder, FOUNDER_PROFILE_FIELDS);
    await founder.save();
    return founder;
  }

  founder = await User.create({
    name: "Ramesh Patil",
    email: FOUNDER_EMAIL,
    password: FOUNDER_PASSWORD,
    role: "founder",
    isEmailVerified: true,
    isProfileComplete: true,
    ...FOUNDER_PROFILE_FIELDS,
  });
  return founder;
}

function coverUrl(seed) {
  return `https://picsum.photos/seed/${seed}/1200/630`;
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function buildStartups(founderId) {
  return [
    {
      founder: founderId,
      name: "गायमित्र दूध डेअरी",
      tagline: "गावातील शुद्ध व दर्जेदार दूध, थेट शेतकऱ्यांकडून ग्राहकांपर्यंत",
      description:
        "आमच्या गायमित्र दूध डेअरीचा उद्देश शुद्ध आणि दर्जेदार दूध व दुग्धजन्य उत्पादने ग्राहकांपर्यंत पोहोचवणे आहे. गावातील शेतकऱ्यांना योग्य दर देऊन त्यांचे आर्थिक हित जपणे हे आमचे ध्येय आहे.",
      logo: coverUrl("gaimitra-logo"),
      coverImage: coverUrl("gaimitra-cover"),
      industry: "Agriculture",
      stage: "idea",
      location: "Kinwat, Nanded, Maharashtra",
      incorporationType: "Sole Proprietorship",
      registrationNumber: "UDYAM-MH-03-0012345",
      foundedDate: new Date("2025-01-15"),
      problemStatement:
        "गावातील दूध उत्पादक शेतकऱ्यांना त्यांच्या दुधाला योग्य बाजारभाव मिळत नाही.\nमध्यस्थांमुळे शेतकऱ्यांचा नफा कमी होतो आणि ग्राहकांना भेसळयुक्त दूध मिळते.",
      solution:
        "शेतकऱ्यांकडून थेट दूध संकलन करून त्यावर प्रक्रिया करून ग्राहकांपर्यंत पोहोचवणे.\nगुणवत्ता तपासणी आणि योग्य साठवणुकीद्वारे शुद्धतेची खात्री देणे.",
      targetAudience: "स्थानिक ग्राहक, हॉटेल्स, मिठाई दुकाने आणि किरकोळ विक्रेते",
      fundingNeeded: 1500000,
      fundingRaised: 900000,
      fundingType: ["Equity", "Grant"],
      investmentType: "Convertible Note",
      minimumInvestment: 50000,
      fundingDurationMonths: 6,
      expectedClosingDate: daysFromNow(196),
      fundUsagePlan: [
        { category: "Equipment", description: "Milk chilling and packaging machines", estimatedCost: 600000 },
        { category: "Cold Storage", description: "Cold chain setup for dairy transport", estimatedCost: 400000 },
        { category: "Working Capital", description: "Farmer payments and daily operations", estimatedCost: 300000 },
        { category: "Marketing", description: "Branding and local distribution", estimatedCost: 200000 },
      ],
      expectedOutcomes: [
        { label: "Break-even", value: "12 months" },
        { label: "Farmers Onboarded", value: "50+ by year 1" },
        { label: "Daily Volume", value: "2,000 litres" },
      ],
      whyInvest: [
        "स्थानिक शेतकऱ्यांचा प्रत्यक्ष पाठिंबा आणि विश्वास",
        "वाढती मागणी असलेला दुग्धजन्य उत्पादनांचा बाजार",
        "अनुभवी आणि समर्पित संस्थापक टीम",
      ],
      team: [
        { name: "Ramesh Patil", role: "Founder & CEO", bio: "10+ years in dairy farming and rural business.", linkedin: "https://linkedin.com/in/rameshpatil", avatar: "" },
        { name: "Sunita Jadhav", role: "Operations Head", bio: "Manages farmer relations and daily collection.", linkedin: "", avatar: "" },
      ],
      openRoles: [
        { title: "Marketing Lead", type: "full_time", workMode: "on_site", description: "Build our local brand and distribution network." },
        { title: "Quality Control Officer", type: "part_time", workMode: "on_site", description: "Ensure milk quality and hygiene standards." },
      ],
      milestones: [
        { title: "गायमित्र दूध डेअरी प्रकल्पाची अधिकृत सुरुवात!", description: "आजपासून प्रकल्पाची अधिकृत सुरुवात झाली आहे.", date: daysAgo(62) },
        { title: "जमीन निवड आणि डेअरी युनिटसाठी जागा निश्चित", description: "स्थानिक प्रशासनाची प्राथमिक मान्यता मिळाली.", date: daysAgo(59) },
        { title: "स्थानिक शेतकऱ्यांसोबत भागीदारी करार", description: "15+ शेतकऱ्यांसोबत दूध पुरवठा करार पूर्ण झाला.", date: daysAgo(61) },
        { title: "व्यवसाय योजना आणि उत्पादन प्रक्रिया पूर्ण", description: "फायनान्स आणि युनिट सेटअपवर काम सुरू.", date: daysAgo(63) },
      ],
      missionStatement: "गावातील प्रत्येक शेतकऱ्याला योग्य मोबदला आणि ग्राहकांना शुद्ध दूध पोहोचवणे.",
      highlights: ["15+ शेतकरी जोडले गेले", "FSSAI परवान्यासाठी अर्ज सादर", "दैनंदिन 500+ लिटर संकलन क्षमता"],
      tractionStats: [
        { label: "Farmers Onboarded", value: "15+" },
        { label: "Daily Collection", value: "500L" },
        { label: "Pre-orders", value: "120" },
      ],
      businessPlan: [
        { label: "Revenue Model", value: "B2C direct sales + B2B supply" },
        { label: "Target Market", value: "Nanded district households" },
        { label: "Growth Strategy", value: "Expand to 3 more talukas by 2027" },
        { label: "Unit Economics", value: "₹8/litre margin" },
      ],
      products: [
        {
          name: "ताजे दूध",
          description: "रोज सकाळी ताजे आणि शुद्ध दूध.",
          image: coverUrl("gaimitra-product-milk"),
          tags: ["Bestseller", "Daily Fresh"],
          price: "₹52/लिटर",
          status: "live",
          features: ["रोज सकाळी संकलन", "कुठलीही भेसळ नाही", "कोल्ड चेन मध्ये साठवण"],
        },
        {
          name: "तूप",
          description: "पारंपरिक पद्धतीने बनवलेले शुद्ध तूप.",
          image: coverUrl("gaimitra-product-ghee"),
          tags: ["Premium"],
          price: "₹650/किलो",
          status: "live",
          features: ["बिलोणा पद्धतीने बनवलेले", "कुठलेही प्रिझर्व्हेटिव्ह नाहीत"],
        },
        {
          name: "दही",
          description: "घट्ट आणि दर्जेदार दही.",
          image: coverUrl("gaimitra-product-curd"),
          tags: [],
          price: "₹60/किलो",
          status: "live",
          features: ["नैसर्गिक आंबवण प्रक्रिया"],
        },
        {
          name: "पनीर",
          description: "ताजे आणि मऊ पनीर.",
          image: coverUrl("gaimitra-product-paneer"),
          tags: ["New"],
          price: "₹320/किलो",
          status: "beta",
          features: ["ऑर्डरनुसार ताजे बनवलेले"],
        },
        {
          name: "ताक",
          description: "पारंपरिक मसालेदार ताक.",
          image: coverUrl("gaimitra-product-buttermilk"),
          tags: [],
          price: "₹20/बाटली",
          status: "coming_soon",
          features: ["पारंपरिक मसाल्यांसह"],
        },
      ],
      productHighlights: ["100% शुद्ध आणि हायजेनिक पॅकेजिंग", "दररोज सकाळी ताजे वितरण", "कुठलीही भेसळ नाही", "FSSAI प्रमाणित प्रक्रिया", "थेट शेतकऱ्यांकडून संकलन", "परवडणाऱ्या किमतीत उपलब्ध"],
      howItWorks: [
        { title: "संकलन", description: "गावातील शेतकऱ्यांकडून दूध संकलन." },
        { title: "तपासणी", description: "गुणवत्ता आणि शुद्धता तपासणी." },
        { title: "प्रक्रिया", description: "पॅकेजिंग आणि कोल्ड स्टोरेज." },
        { title: "वितरण", description: "ग्राहकांपर्यंत थेट वितरण." },
      ],
      planPhases: [
        { title: "Launch", timeframe: "Month 1-3", checklist: ["Setup chilling unit", "Onboard 20 farmers", "FSSAI registration"], estimatedCost: 500000 },
        { title: "Scale", timeframe: "Month 4-8", checklist: ["Expand to 50 farmers", "Launch value-added products", "Open 2 retail outlets"], estimatedCost: 600000 },
        { title: "Expand", timeframe: "Month 9-12", checklist: ["Enter neighbouring taluka", "B2B partnerships with hotels", "Launch home delivery app"], estimatedCost: 400000 },
      ],
      marketStats: [
        { value: "₹500 Cr", label: "Regional Dairy Market" },
        { value: "12%", label: "YoY Growth" },
        { value: "2,000+", label: "Households in Reach" },
        { value: "40%", label: "Unorganized Market Share" },
      ],
      competitiveAdvantage: ["थेट शेतकरी भागीदारी, मध्यस्थ नाहीत", "कमी किमतीत जास्त शुद्धता", "स्थानिक विश्वास आणि ब्रँड ओळख"],
      whyProduct: ["शेतापासून थेट ग्राहकांपर्यंत", "स्वच्छ आणि हायजेनिक प्रक्रिया", "रोज ताजे उत्पादन"],
      website: "https://gaimitradairy.example.com",
      pitchDeckUrl: "",
      documents: [
        { name: "Pitch Deck.pdf", description: "Startup pitch deck and overview", url: "https://example.com/docs/pitch-deck.pdf", category: "Pitch Deck", fileSize: "2.4 MB", uploadedAt: daysAgo(62) },
        { name: "Business Plan.pdf", description: "Complete business plan document", url: "https://example.com/docs/business-plan.pdf", category: "Business Plan", fileSize: "3.1 MB", uploadedAt: daysAgo(62) },
        { name: "FSSAI License.pdf", description: "Food safety and standards license", url: "https://example.com/docs/fssai-license.pdf", category: "Legal & Registration", fileSize: "1.1 MB", uploadedAt: daysAgo(56) },
      ],
      socialLinks: { linkedin: "", twitter: "", facebook: "https://facebook.com/gaimitradairy", instagram: "https://instagram.com/gaimitradairy" },
      status: "published",
    },
    {
      founder: founderId,
      name: "ShikshaSaathi",
      tagline: "Connecting rural students with quality online tutors",
      description:
        "ShikshaSaathi is an EdTech platform that connects students in rural Maharashtra with qualified tutors for live online classes, in regional languages, at affordable prices.",
      logo: coverUrl("shikshasaathi-logo"),
      coverImage: coverUrl("shikshasaathi-cover"),
      industry: "Education",
      stage: "seed",
      location: "Pune, Maharashtra",
      incorporationType: "Private Limited",
      registrationNumber: "U80301PN2024PTC123456",
      foundedDate: new Date("2024-06-01"),
      problemStatement: "Rural students lack access to quality teachers, especially for science and maths.\nExisting EdTech platforms are English-first and expensive for rural families.",
      solution: "A regional-language-first tutoring marketplace with flexible, low-cost pricing plans and offline-friendly low-bandwidth video.",
      targetAudience: "Students in classes 8-12 in Tier 3/4 towns and villages",
      fundingNeeded: 5000000,
      fundingRaised: 1800000,
      fundingType: ["Equity"],
      investmentType: "Priced Round",
      minimumInvestment: 100000,
      fundingDurationMonths: 9,
      expectedClosingDate: daysFromNow(120),
      fundUsagePlan: [
        { category: "Tech Platform", description: "App and low-bandwidth video infrastructure", estimatedCost: 2000000 },
        { category: "Tutor Onboarding", description: "Recruiting and training tutors", estimatedCost: 1200000 },
        { category: "Marketing", description: "District-level awareness campaigns", estimatedCost: 1000000 },
        { category: "Operations", description: "Support team and working capital", estimatedCost: 800000 },
      ],
      expectedOutcomes: [
        { label: "Break-even", value: "18 months" },
        { label: "Active Students", value: "10,000+ by year 2" },
      ],
      whyInvest: ["Large underserved rural EdTech market", "Strong early retention among pilot students", "Experienced founding team from education sector"],
      team: [
        { name: "Priya Deshmukh", role: "Founder & CEO", bio: "Former teacher, 8 years in rural education programs.", linkedin: "", avatar: "" },
        { name: "Amit Kulkarni", role: "CTO", bio: "Built low-bandwidth video systems for 5 years.", linkedin: "", avatar: "" },
      ],
      openRoles: [{ title: "Regional Growth Manager", type: "full_time", workMode: "hybrid", description: "Drive tutor and student onboarding across districts." }],
      milestones: [
        { title: "Platform beta launched", description: "First 500 students onboarded in pilot districts.", date: daysAgo(120) },
        { title: "Crossed 2,000 active students", description: "Organic growth through word of mouth.", date: daysAgo(45) },
      ],
      missionStatement: "Make quality education accessible to every student, regardless of where they live.",
      highlights: ["2,000+ active students", "95% tutor satisfaction rate", "Available in Marathi and Hindi"],
      tractionStats: [
        { label: "Active Students", value: "2,000+" },
        { label: "Tutors Onboarded", value: "80+" },
        { label: "Avg. Session Rating", value: "4.6/5" },
      ],
      businessPlan: [
        { label: "Revenue Model", value: "Subscription + per-session fee" },
        { label: "Target Market", value: "Tier 3/4 Maharashtra towns" },
        { label: "Growth Strategy", value: "District-wise school partnerships" },
      ],
      products: [
        {
          name: "Live Tutoring",
          description: "1-on-1 and small group live classes.",
          image: coverUrl("shikshasaathi-product-tutoring"),
          tags: ["Popular", "SaaS"],
          price: "₹499/month",
          status: "live",
          url: "https://shikshasaathi.example.com/live-tutoring",
          features: ["Live regional-language classes", "Low-bandwidth video", "Progress tracking for parents"],
        },
        {
          name: "Doubt Solving App",
          description: "Instant doubt resolution via chat.",
          image: coverUrl("shikshasaathi-product-doubtapp"),
          tags: ["New"],
          price: "Free",
          status: "beta",
          url: "https://shikshasaathi.example.com/doubt-app",
          features: ["Chat with verified tutors", "Photo-based doubt upload", "24-hour response time"],
        },
      ],
      productHighlights: ["Regional language support", "Affordable monthly plans", "Works on low-bandwidth connections"],
      howItWorks: [
        { title: "Sign Up", description: "Student registers and selects subjects." },
        { title: "Match", description: "Matched with a verified tutor." },
        { title: "Learn", description: "Attend live classes and track progress." },
      ],
      planPhases: [
        { title: "Pilot Expansion", timeframe: "Month 1-4", checklist: ["Onboard 5,000 students", "Expand to 3 districts"], estimatedCost: 1500000 },
        { title: "Scale", timeframe: "Month 5-9", checklist: ["Launch mobile app", "Partner with 50 schools"], estimatedCost: 2500000 },
      ],
      marketStats: [
        { value: "₹2,000 Cr", label: "Rural EdTech Market" },
        { value: "18%", label: "YoY Growth" },
        { value: "5M+", label: "Target Students" },
      ],
      competitiveAdvantage: ["Regional-language-first approach", "Low-bandwidth optimized platform", "Affordable pricing for rural families"],
      whyProduct: ["Built for low-connectivity areas", "Vernacular content library", "Verified, trained tutors"],
      website: "https://shikshasaathi.example.com",
      pitchDeckUrl: "",
      documents: [
        { name: "Pitch Deck.pdf", description: "Investor pitch deck", url: "https://example.com/docs/shiksha-pitch.pdf", category: "Pitch Deck", fileSize: "3.0 MB", uploadedAt: daysAgo(30) },
      ],
      socialLinks: { linkedin: "https://linkedin.com/company/shikshasaathi", twitter: "", facebook: "", instagram: "" },
      status: "published",
    },
    {
      founder: founderId,
      name: "Suryashakti Solar",
      tagline: "Affordable solar power solutions for farms and small businesses",
      description:
        "Suryashakti Solar designs, installs and finances rooftop and farm solar systems for small businesses and farmers across Maharashtra, cutting electricity costs by up to 70%.",
      logo: coverUrl("suryashakti-logo"),
      coverImage: coverUrl("suryashakti-cover"),
      industry: "Clean Energy",
      stage: "pre_seed",
      location: "Nashik, Maharashtra",
      incorporationType: "LLP",
      registrationNumber: "AAK-1234",
      foundedDate: new Date("2025-03-10"),
      problemStatement: "Farmers and small shop owners face high electricity bills and frequent power cuts.\nUpfront solar installation cost is unaffordable for most small businesses.",
      solution: "Zero-upfront-cost solar leasing model with pay-as-you-save monthly plans.",
      targetAudience: "Farmers, small factories, and retail shop owners",
      fundingNeeded: 3000000,
      fundingRaised: 450000,
      fundingType: ["Equity", "Debt"],
      investmentType: "SAFE Note",
      minimumInvestment: 25000,
      fundingDurationMonths: 8,
      expectedClosingDate: daysFromNow(150),
      fundUsagePlan: [
        { category: "Inventory", description: "Solar panels and inverters", estimatedCost: 1500000 },
        { category: "Installation Team", description: "Hiring and training technicians", estimatedCost: 700000 },
        { category: "Marketing", description: "Farmer outreach campaigns", estimatedCost: 500000 },
        { category: "Working Capital", description: "Operations buffer", estimatedCost: 300000 },
      ],
      expectedOutcomes: [
        { label: "Break-even", value: "24 months" },
        { label: "Installations", value: "200+ by year 1" },
      ],
      whyInvest: ["Rising demand for renewable energy in rural areas", "Government subsidy support for solar adoption", "Recurring revenue via leasing model"],
      team: [{ name: "Sanjay More", role: "Founder & CEO", bio: "Ex-solar engineer with 6 years of industry experience.", linkedin: "", avatar: "" }],
      openRoles: [
        { title: "Solar Installation Technician", type: "full_time", workMode: "on_site", description: "Install and maintain solar systems at customer sites." },
        { title: "Sales Executive", type: "full_time", workMode: "on_site", description: "Sign up farmers and small businesses for solar leasing." },
      ],
      milestones: [{ title: "First 10 installations completed", description: "Successfully piloted the leasing model.", date: daysAgo(20) }],
      missionStatement: "Make clean, affordable energy accessible to every farmer and small business.",
      highlights: ["10 pilot installations completed", "Zero-upfront leasing model validated", "Government subsidy partnership in progress"],
      tractionStats: [
        { label: "Installations", value: "10" },
        { label: "Monthly Savings for Customers", value: "₹3,500 avg" },
      ],
      businessPlan: [
        { label: "Revenue Model", value: "Monthly leasing fee" },
        { label: "Target Market", value: "Nashik & Ahmednagar districts" },
      ],
      products: [
        {
          name: "Rooftop Solar Kit",
          description: "3kW-10kW rooftop solar systems.",
          image: coverUrl("suryashakti-product-solarkit"),
          tags: ["Best Value", "Zero Upfront"],
          price: "Pay-as-you-save, from ₹1,999/month",
          status: "live",
          url: "https://suryashaktisolar.example.com/rooftop-kit",
          features: ["Zero upfront installation cost", "25-year panel warranty", "Free site survey", "Government subsidy assistance"],
        },
      ],
      productHighlights: ["Zero upfront installation cost", "Government subsidy assistance", "25-year panel warranty"],
      howItWorks: [
        { title: "Site Survey", description: "Free assessment of the customer's site." },
        { title: "Installation", description: "Solar system installed within 7 days." },
        { title: "Pay as You Save", description: "Customer pays a fixed monthly fee, lower than their electricity bill." },
      ],
      planPhases: [{ title: "Pilot to Scale", timeframe: "Month 1-6", checklist: ["Complete 50 installations", "Secure subsidy partnership"], estimatedCost: 1800000 }],
      marketStats: [
        { value: "₹1,200 Cr", label: "Maharashtra Solar Market" },
        { value: "22%", label: "YoY Growth" },
      ],
      competitiveAdvantage: ["Zero-upfront-cost model unique in the region", "Local installation and maintenance team"],
      whyProduct: ["Cuts electricity bills by up to 70%", "No upfront investment needed"],
      website: "",
      pitchDeckUrl: "",
      documents: [],
      socialLinks: { linkedin: "", twitter: "", facebook: "", instagram: "" },
      status: "published",
    },
  ];
}

async function run() {
  await connectDB();

  const founder = await getOrCreateFounder();
  const startups = buildStartups(founder._id);

  for (const data of startups) {
    const existing = await Startup.findOne({ founder: founder._id, name: data.name });
    if (existing) {
      // $set only touches the fields listed in `data` — followers, interested,
      // founderVerified/isVerified, viewCount, reports, verificationRequests etc.
      // (anything real users may have generated) are left untouched.
      await Startup.updateOne({ _id: existing._id }, { $set: data });
      console.log(`Updated "${data.name}" (${existing._id})`);
      continue;
    }
    const created = await Startup.create(data);
    console.log(`Created "${created.name}" (${created._id})`);
  }

  console.log("\nDemo founder login:");
  console.log(`  Email:    ${FOUNDER_EMAIL}`);
  console.log(`  Password: ${FOUNDER_PASSWORD}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
