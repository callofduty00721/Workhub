import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";

const DEMO_PASSWORD = "Demo@12345";

const FREELANCERS = [
  {
    name: "Ananya Joshi",
    email: "ananya.joshi@growhive.demo",
    headline: "UI/UX Designer for early-stage products",
    bio: "I design clean, usable interfaces for web and mobile apps — from wireframes to polished, developer-ready Figma files.",
    location: "Pune, Maharashtra, India",
    skills: ["UI/UX Design", "Figma", "Wireframing", "Prototyping"],
    hourlyRate: 1000,
    yearsOfExperience: 4,
    responseTimeLabel: "Under 2 hrs",
    languages: ["Marathi", "Hindi", "English"],
    kycStatus: "verified",
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@growhive.demo",
    headline: "Backend Developer — Python, Django, PostgreSQL",
    bio: "I build reliable backend systems and REST APIs for startups, with a focus on clean architecture and query performance.",
    location: "Hyderabad, Telangana, India",
    skills: ["Python", "Django", "PostgreSQL", "REST APIs"],
    hourlyRate: 1300,
    yearsOfExperience: 5,
    responseTimeLabel: "Under 3 hrs",
    languages: ["Hindi", "English", "Telugu"],
    kycStatus: "pending",
  },
  {
    name: "Meera Nair",
    email: "meera.nair@growhive.demo",
    headline: "Video Editor for YouTube & Instagram Reels",
    bio: "I edit fast-paced, engaging videos for creators and brands — cutting, color grading, sound design, and captions.",
    location: "Kochi, Kerala, India",
    skills: ["Video Editing", "Premiere Pro", "DaVinci Resolve", "Motion Graphics"],
    hourlyRate: 700,
    yearsOfExperience: 3,
    responseTimeLabel: "Under 4 hrs",
    languages: ["Malayalam", "English"],
    kycStatus: "unverified",
  },
  {
    name: "Farhan Sheikh",
    email: "farhan.sheikh@growhive.demo",
    headline: "Digital Marketing Specialist — Performance & SEO",
    bio: "I run paid campaigns and organic SEO strategy for D2C brands and startups looking to grow efficiently.",
    location: "Ahmedabad, Gujarat, India",
    skills: ["SEO", "Google Ads", "Meta Ads", "Analytics"],
    hourlyRate: 950,
    yearsOfExperience: 4,
    responseTimeLabel: "Under 2 hrs",
    languages: ["Gujarati", "Hindi", "English"],
    kycStatus: "verified",
  },
];

const JOB_SEEKERS = [
  {
    name: "Kunal Bhosale",
    email: "kunal.bhosale@growhive.demo",
    headline: "Software Engineer looking for full-time roles",
    bio: "2 years of experience building web applications with React and Node.js, looking for a full-time engineering role.",
    location: "Nashik, Maharashtra, India",
    skills: ["React", "Node.js", "JavaScript"],
    jobSeekerProfile: {
      desiredRole: "Software Engineer",
      expectedSalary: 700000,
      noticePeriodDays: 30,
      preferredLocations: ["Pune", "Bengaluru", "Remote"],
      willingToRelocate: true,
    },
  },
  {
    name: "Sneha Reddy",
    email: "sneha.reddy@growhive.demo",
    headline: "Business Analyst — Data-driven decision making",
    bio: "I turn business problems into clear requirements and dashboards, with 3 years across fintech and retail analytics.",
    location: "Hyderabad, Telangana, India",
    skills: ["SQL", "Excel", "Power BI", "Business Analysis"],
    jobSeekerProfile: {
      desiredRole: "Business Analyst",
      expectedSalary: 900000,
      noticePeriodDays: 60,
      preferredLocations: ["Hyderabad", "Remote"],
      willingToRelocate: false,
    },
  },
  {
    name: "Arvind Menon",
    email: "arvind.menon@growhive.demo",
    headline: "Product Manager — B2B SaaS",
    bio: "5 years leading product for B2B SaaS tools, from discovery through launch, now looking for my next PM role.",
    location: "Bengaluru, Karnataka, India",
    skills: ["Product Management", "Roadmapping", "User Research"],
    jobSeekerProfile: {
      desiredRole: "Product Manager",
      expectedSalary: 1800000,
      noticePeriodDays: 90,
      preferredLocations: ["Bengaluru"],
      willingToRelocate: false,
    },
  },
  {
    name: "Pooja Chavan",
    email: "pooja.chavan@growhive.demo",
    headline: "HR Executive — Talent Acquisition",
    bio: "I've spent 2 years hiring for early-stage startups and am looking for an HR role at a growing company.",
    location: "Mumbai, Maharashtra, India",
    skills: ["Recruitment", "Onboarding", "HRMS"],
    jobSeekerProfile: {
      desiredRole: "HR Executive",
      expectedSalary: 600000,
      noticePeriodDays: 15,
      preferredLocations: ["Mumbai", "Pune"],
      willingToRelocate: true,
    },
  },
];

const INFLUENCERS = [
  {
    name: "Ritika Malhotra",
    email: "ritika.malhotra@growhive.demo",
    headline: "Fashion & Lifestyle Creator",
    bio: "I create everyday fashion and styling content for young working women across India.",
    location: "Delhi, India",
    influencerProfile: {
      category: "Fashion",
      niche: "Everyday Styling",
      platforms: [
        { platform: "Instagram", handle: "@ritika.styles", followers: 145000, url: "https://instagram.com/ritika.styles" },
        { platform: "YouTube", handle: "Ritika Malhotra", followers: 22000, url: "https://youtube.com/@ritikamalhotra" },
      ],
      rateCard: [
        { platform: "Instagram", contentType: "Reel", priceInInr: 25000 },
        { platform: "Instagram", contentType: "Story", priceInInr: 8000 },
      ],
      languages: [{ name: "Hindi", level: "native" }, { name: "English", level: "fluent" }],
    },
  },
  {
    name: "Aman Gupta",
    email: "aman.gupta.creator@growhive.demo",
    headline: "Tech Reviewer & Gadget Enthusiast",
    bio: "In-depth reviews and comparisons of smartphones, laptops, and gadgets for a tech-curious audience.",
    location: "Noida, Uttar Pradesh, India",
    influencerProfile: {
      category: "Technology",
      niche: "Gadget Reviews",
      platforms: [{ platform: "YouTube", handle: "TechWithAman", followers: 310000, url: "https://youtube.com/@techwithaman" }],
      rateCard: [{ platform: "YouTube", contentType: "Dedicated Video", priceInInr: 60000 }],
      languages: [{ name: "Hindi", level: "native" }, { name: "English", level: "fluent" }],
    },
  },
  {
    name: "Divya Iyer",
    email: "divya.iyer@growhive.demo",
    headline: "Home Cook & Food Content Creator",
    bio: "South Indian home-style recipes and quick weeknight meals, shared with a growing food-loving community.",
    location: "Chennai, Tamil Nadu, India",
    influencerProfile: {
      category: "Food & Cooking",
      niche: "South Indian Home Cooking",
      platforms: [
        { platform: "Instagram", handle: "@divyacooks", followers: 88000, url: "https://instagram.com/divyacooks" },
        { platform: "YouTube", handle: "Divya's Kitchen", followers: 45000, url: "https://youtube.com/@divyaskitchen" },
      ],
      rateCard: [{ platform: "Instagram", contentType: "Reel", priceInInr: 15000 }],
      languages: [{ name: "Tamil", level: "native" }, { name: "English", level: "conversational" }],
    },
  },
  {
    name: "Karan Thakur",
    email: "karan.thakur@growhive.demo",
    headline: "Fitness Coach & Content Creator",
    bio: "Strength training and nutrition content for beginners, with simple home-workout routines.",
    location: "Jaipur, Rajasthan, India",
    influencerProfile: {
      category: "Fitness",
      niche: "Strength Training",
      platforms: [{ platform: "Instagram", handle: "@karanfit", followers: 62000, url: "https://instagram.com/karanfit" }],
      rateCard: [{ platform: "Instagram", contentType: "Reel", priceInInr: 12000 }],
      languages: [{ name: "Hindi", level: "native" }],
    },
  },
];

const EMPLOYERS = [
  {
    name: "Neelam Kapoor",
    email: "neelam.kapoor@growhive.demo",
    headline: "HR Head, Bright Edge Technologies",
    companyName: "Bright Edge Technologies",
    location: "Bengaluru, Karnataka, India",
  },
  {
    name: "Suresh Pillai",
    email: "suresh.pillai@growhive.demo",
    headline: "Talent Acquisition Lead, QuantumLeap Softwares",
    companyName: "QuantumLeap Softwares",
    location: "Chennai, Tamil Nadu, India",
  },
  {
    name: "Zoya Khan",
    email: "zoya.khan@growhive.demo",
    headline: "People Ops Manager, Verdant Foods Pvt Ltd",
    companyName: "Verdant Foods Pvt Ltd",
    location: "Mumbai, Maharashtra, India",
  },
  {
    name: "Ramesh Iyengar",
    email: "ramesh.iyengar@growhive.demo",
    headline: "Founder & CEO, Skyline Logistics",
    companyName: "Skyline Logistics",
    location: "Pune, Maharashtra, India",
  },
];

const INVESTORS = [
  {
    name: "Vivek Agarwal",
    email: "vivek.agarwal@growhive.demo",
    headline: "Angel investor — early-stage consumer tech",
    bio: "I write early checks into consumer tech founders solving everyday problems for Indian users.",
    location: "Mumbai, Maharashtra, India",
    investorType: "angel",
    investmentFocus: ["Consumer Tech", "D2C", "Fintech"],
    ticketSizeMin: 500000,
    ticketSizeMax: 5000000,
    portfolioCompanyCount: 9,
    fundName: "",
    fundSize: 0,
    preferredStages: ["idea", "pre_seed", "seed"],
  },
  {
    name: "Shalini Rao",
    email: "shalini.rao@growhive.demo",
    headline: "Partner, Kavach Ventures",
    bio: "VC investing in B2B SaaS and enterprise software founders across India and Southeast Asia.",
    location: "Bengaluru, Karnataka, India",
    investorType: "venture_capital",
    investmentFocus: ["B2B SaaS", "Enterprise Software"],
    ticketSizeMin: 5000000,
    ticketSizeMax: 50000000,
    portfolioCompanyCount: 18,
    fundName: "Kavach Ventures",
    fundSize: 500000000,
    preferredStages: ["seed", "series_a"],
  },
  {
    name: "Devendra Patil",
    email: "devendra.patil@growhive.demo",
    headline: "Family office investor — agri & climate tech",
    bio: "Managing family office capital deployed into agri-tech and climate-focused startups.",
    location: "Nagpur, Maharashtra, India",
    investorType: "family_office",
    investmentFocus: ["Agri-Tech", "Climate Tech"],
    ticketSizeMin: 2000000,
    ticketSizeMax: 20000000,
    portfolioCompanyCount: 6,
    fundName: "Patil Family Office",
    fundSize: 0,
    preferredStages: ["seed", "series_a", "series_b"],
  },
  {
    name: "Namrata Sharma",
    email: "namrata.sharma@growhive.demo",
    headline: "Angel investor — healthtech & wellness",
    bio: "Ex-founder turned angel investor, backing healthtech and wellness startups at the idea and pre-seed stage.",
    location: "Delhi, India",
    investorType: "angel",
    investmentFocus: ["Healthtech", "Wellness"],
    ticketSizeMin: 300000,
    ticketSizeMax: 3000000,
    portfolioCompanyCount: 5,
    fundName: "",
    fundSize: 0,
    preferredStages: ["idea", "pre_seed"],
  },
];

const MENTORS = [
  {
    name: "Dr. Anil Kulkarni",
    email: "anil.kulkarni@growhive.demo",
    headline: "Technology mentor — ex-CTO, 20+ years in engineering leadership",
    bio: "I mentor early-stage technical founders on architecture decisions, hiring their first engineers, and scaling a tech team.",
    location: "Pune, Maharashtra, India",
    yearsOfExperience: 20,
    mentorCategory: "technology",
    expertise: ["System Architecture", "Engineering Leadership", "Scaling Teams"],
    sessionRate: 2500,
    sessionFormat: "video",
  },
  {
    name: "Radhika Menon",
    email: "radhika.menon@growhive.demo",
    headline: "Marketing mentor — brand & growth strategy",
    bio: "15 years in brand marketing at consumer companies, now mentoring founders on positioning and go-to-market.",
    location: "Bengaluru, Karnataka, India",
    yearsOfExperience: 15,
    mentorCategory: "marketing",
    expertise: ["Brand Strategy", "Go-To-Market", "Growth Marketing"],
    sessionRate: 2000,
    sessionFormat: "video",
  },
  {
    name: "Sameer Joshi",
    email: "sameer.joshi@growhive.demo",
    headline: "Startup mentor — 2x founder, 1 exit",
    bio: "I've built and sold one startup and shut down another — I mentor founders on the practical, unglamorous parts of company-building.",
    location: "Mumbai, Maharashtra, India",
    yearsOfExperience: 12,
    mentorCategory: "startup",
    expertise: ["Fundraising", "Co-founder Conflicts", "Product-Market Fit"],
    sessionRate: 3000,
    sessionFormat: "chat",
  },
  {
    name: "Lata Deshpande",
    email: "lata.deshpande@growhive.demo",
    headline: "Finance mentor — startup financial planning",
    bio: "Chartered accountant helping early-stage founders with runway planning, unit economics, and fundraising financials.",
    location: "Pune, Maharashtra, India",
    yearsOfExperience: 18,
    mentorCategory: "finance",
    expertise: ["Financial Modeling", "Unit Economics", "Fundraising Prep"],
    sessionRate: 1800,
    sessionFormat: "video",
  },
];

const PARTNERS = [
  {
    name: "Om Prakash Yadav",
    email: "om.yadav@growhive.demo",
    headline: "Program Lead, Startup Sahayak",
    location: "Lucknow, Uttar Pradesh, India",
    organizationName: "Startup Sahayak Foundation",
    partnerType: "service_provider",
    programDetails: "Free legal and compliance support for early-stage startups across Uttar Pradesh, including company registration and IP filing.",
    startupsSupportedCount: 40,
    applicationLink: "https://startupsahayak.example.com/apply",
  },
  {
    name: "Kavya Subramaniam",
    email: "kavya.subramaniam@growhive.demo",
    headline: "Partnerships Lead, CloudNine DevTools",
    location: "Chennai, Tamil Nadu, India",
    organizationName: "CloudNine DevTools",
    partnerType: "technology_partner",
    programDetails: "Free cloud infrastructure credits and technical onboarding support for startups building on our platform.",
    startupsSupportedCount: 65,
    applicationLink: "https://cloudninedevtools.example.com/startups",
  },
  {
    name: "Rajiv Malhotra",
    email: "rajiv.malhotra@growhive.demo",
    headline: "Managing Director, Confluence Consulting",
    location: "Gurugram, Haryana, India",
    organizationName: "Confluence Consulting",
    partnerType: "consultant",
    programDetails: "Strategy and operations consulting for Series A/B startups looking to scale efficiently.",
    startupsSupportedCount: 22,
    applicationLink: "https://confluenceconsulting.example.com/contact",
  },
  {
    name: "Ishita Bansal",
    email: "ishita.bansal@growhive.demo",
    headline: "Founder, LaunchPad Collective",
    location: "Jaipur, Rajasthan, India",
    organizationName: "LaunchPad Collective",
    partnerType: "company",
    programDetails: "Co-working space and community programming for early-stage founders in Rajasthan.",
    startupsSupportedCount: 30,
    applicationLink: "https://launchpadcollective.example.com/join",
  },
];

const CLIENTS = [
  {
    name: "Meenal Kulkarni",
    email: "meenal.kulkarni@growhive.demo",
    headline: "Founder, Kulkarni Handicrafts",
    companyName: "Kulkarni Handicrafts",
    location: "Kolhapur, Maharashtra, India",
  },
  {
    name: "Tarun Bhatia",
    email: "tarun.bhatia@growhive.demo",
    headline: "Product Head, NimbusCart",
    companyName: "NimbusCart",
    location: "Gurugram, Haryana, India",
  },
  {
    name: "Farah Ansari",
    email: "farah.ansari@growhive.demo",
    headline: "Marketing Director, Bloom Wellness",
    companyName: "Bloom Wellness",
    location: "Hyderabad, Telangana, India",
  },
  {
    name: "Girish Nadkarni",
    email: "girish.nadkarni@growhive.demo",
    headline: "Operations Head, Coastal Ventures",
    companyName: "Coastal Ventures",
    location: "Goa, India",
  },
];

const BRANDS = [
  {
    name: "Aisha Merchant",
    email: "aisha.merchant@growhive.demo",
    headline: "Marketing Lead, Glow & Co",
    companyName: "Glow & Co",
    location: "Mumbai, Maharashtra, India",
    brandProfile: {
      industry: "Skincare",
      categories: ["Skincare", "Beauty"],
      website: "https://glowandco.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/glowandco" }],
      followerCount: 210000,
      products: [{ name: "Vitamin C Serum", description: "Brightening daily serum", imageUrl: "" }],
      influencerRequirements: [{ category: "Beauty", minFollowers: 10000, platforms: ["Instagram"], location: "India", notes: "Looking for skincare-focused creators" }],
    },
  },
  {
    name: "Nikhil Kapadia",
    email: "nikhil.kapadia@growhive.demo",
    headline: "Brand Manager, Urban Threads",
    companyName: "Urban Threads",
    location: "Bengaluru, Karnataka, India",
    brandProfile: {
      industry: "Fashion",
      categories: ["Apparel", "Streetwear"],
      website: "https://urbanthreads.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/urbanthreads" }],
      followerCount: 145000,
      products: [{ name: "Oversized Tee Collection", description: "Streetwear essentials", imageUrl: "" }],
      influencerRequirements: [{ category: "Fashion", minFollowers: 20000, platforms: ["Instagram", "YouTube"], location: "India", notes: "Streetwear/fashion niche preferred" }],
    },
  },
  {
    name: "Priyanka Bose",
    email: "priyanka.bose@growhive.demo",
    headline: "Growth Lead, FitFuel",
    companyName: "FitFuel",
    location: "Delhi, India",
    brandProfile: {
      industry: "Health & Nutrition",
      categories: ["Sports Nutrition", "Wellness"],
      website: "https://fitfuel.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/fitfuel" }],
      followerCount: 98000,
      products: [{ name: "Whey Protein Isolate", description: "Fast-absorbing protein powder", imageUrl: "" }],
      influencerRequirements: [{ category: "Fitness", minFollowers: 15000, platforms: ["Instagram"], location: "India", notes: "Fitness/nutrition creators only" }],
    },
  },
  {
    name: "Rohan Kaul",
    email: "rohan.kaul@growhive.demo",
    headline: "Marketing Head, TechNest",
    companyName: "TechNest",
    location: "Bengaluru, Karnataka, India",
    brandProfile: {
      industry: "Consumer Electronics",
      categories: ["Smart Home", "Audio"],
      website: "https://technest.example.com",
      socialLinks: [{ platform: "YouTube", url: "https://youtube.com/@technest" }],
      followerCount: 76000,
      products: [{ name: "Smart Speaker Mini", description: "Compact voice-controlled speaker", imageUrl: "" }],
      influencerRequirements: [{ category: "Technology", minFollowers: 25000, platforms: ["YouTube"], location: "India", notes: "Tech reviewers with unboxing experience" }],
    },
  },
];

const AGENCIES = [
  {
    name: "Varun Oberoi",
    email: "varun.oberoi@growhive.demo",
    headline: "Founder, Spark Digital Agency",
    companyName: "Spark Digital Agency",
    location: "Mumbai, Maharashtra, India",
    agencyProfile: {
      agencyType: "Influencer Marketing",
      website: "https://sparkdigital.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/sparkdigitalagency" }],
      teamSize: 12,
      services: ["influencer_marketing", "social_media_marketing"],
      clients: [{ clientName: "Nova Beverages", logoUrl: "", description: "Ran a 3-month influencer campaign for a new product launch" }],
      pastCampaigns: [{ brandName: "Nova Beverages", description: "Product launch influencer campaign", resultMetric: "2.4M reach", logoUrl: "" }],
    },
  },
  {
    name: "Alisha Fernandez",
    email: "alisha.fernandez@growhive.demo",
    headline: "Managing Partner, Creston Media",
    companyName: "Creston Media",
    location: "Bengaluru, Karnataka, India",
    agencyProfile: {
      agencyType: "Performance Marketing",
      website: "https://crestonmedia.example.com",
      socialLinks: [{ platform: "LinkedIn", url: "https://linkedin.com/company/crestonmedia" }],
      teamSize: 25,
      services: ["performance_marketing", "brand_campaigns"],
      clients: [{ clientName: "Urban Threads", logoUrl: "", description: "Managed paid social campaigns" }],
      pastCampaigns: [{ brandName: "Urban Threads", description: "Festive season performance campaign", resultMetric: "3.2x ROAS", logoUrl: "" }],
    },
  },
  {
    name: "Rakesh Trivedi",
    email: "rakesh.trivedi@growhive.demo",
    headline: "Creative Director, PixelForge Studio",
    companyName: "PixelForge Studio",
    location: "Ahmedabad, Gujarat, India",
    agencyProfile: {
      agencyType: "Content Production",
      website: "https://pixelforgestudio.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/pixelforgestudio" }],
      teamSize: 8,
      services: ["content_production", "ugc"],
      clients: [{ clientName: "FitFuel", logoUrl: "", description: "Produced UGC-style ad creatives" }],
      pastCampaigns: [{ brandName: "FitFuel", description: "UGC ad creative batch", resultMetric: "18 videos delivered", logoUrl: "" }],
    },
  },
  {
    name: "Nidhi Chauhan",
    email: "nidhi.chauhan@growhive.demo",
    headline: "CEO, BrightWave Marketing",
    companyName: "BrightWave Marketing",
    location: "Pune, Maharashtra, India",
    agencyProfile: {
      agencyType: "Social Media Marketing",
      website: "https://brightwavemarketing.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/brightwavemarketing" }],
      teamSize: 15,
      services: ["social_media_marketing", "pr"],
      clients: [{ clientName: "Glow & Co", logoUrl: "", description: "Full social media management" }],
      pastCampaigns: [{ brandName: "Glow & Co", description: "Always-on social media management", resultMetric: "40% follower growth", logoUrl: "" }],
    },
  },
];

const TALENT_PARTNERS = [
  {
    name: "Simran Kaur",
    email: "simran.kaur@growhive.demo",
    headline: "Founder, Star Circle Talent Management",
    companyName: "Star Circle Talent Management",
    location: "Mumbai, Maharashtra, India",
    talentPartnerProfile: {
      partnerType: "Talent Manager",
      website: "https://starcircletalent.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/starcircletalent" }],
      services: ["Creator Management", "Brand Deal Negotiation"],
      brandPartnerships: [{ clientName: "Glow & Co", logoUrl: "", description: "Negotiated a season-long ambassador deal" }],
    },
  },
  {
    name: "Aditya Ranganathan",
    email: "aditya.ranganathan@growhive.demo",
    headline: "Co-founder, Nova Creators Collective",
    companyName: "Nova Creators Collective",
    location: "Bengaluru, Karnataka, India",
    talentPartnerProfile: {
      partnerType: "Talent Agency",
      website: "https://novacreators.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/novacreators" }],
      services: ["Talent Representation", "Content Strategy"],
      brandPartnerships: [{ clientName: "TechNest", logoUrl: "", description: "Placed 3 tech creators for a launch campaign" }],
    },
  },
  {
    name: "Tanvi Shah",
    email: "tanvi.shah@growhive.demo",
    headline: "Founder, InfluenceHub",
    companyName: "InfluenceHub",
    location: "Ahmedabad, Gujarat, India",
    talentPartnerProfile: {
      partnerType: "Talent Manager",
      website: "https://influencehub.example.com",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/influencehub" }],
      services: ["Creator Management", "Campaign Coordination"],
      brandPartnerships: [{ clientName: "FitFuel", logoUrl: "", description: "Coordinated a multi-creator fitness campaign" }],
    },
  },
  {
    name: "Yash Choudhary",
    email: "yash.choudhary@growhive.demo",
    headline: "Director, CreatorLink Talent",
    companyName: "CreatorLink Talent",
    location: "Jaipur, Rajasthan, India",
    talentPartnerProfile: {
      partnerType: "Talent Agency",
      website: "https://creatorlinktalent.example.com",
      socialLinks: [{ platform: "LinkedIn", url: "https://linkedin.com/company/creatorlinktalent" }],
      services: ["Talent Representation", "Rate Negotiation"],
      brandPartnerships: [{ clientName: "Urban Threads", logoUrl: "", description: "Represented 5 fashion creators for a seasonal drop" }],
    },
  },
];

const FOUNDERS = [
  {
    name: "Abhinav Saxena",
    email: "abhinav.saxena@growhive.demo",
    headline: "Founder, building in climate tech",
    bio: "Building a startup focused on carbon-tracking tools for small and mid-sized manufacturers.",
    location: "Delhi, India",
  },
  {
    name: "Riya Kapoor",
    email: "riya.kapoor@growhive.demo",
    headline: "Founder, building in fintech",
    bio: "Building a savings and micro-investing app for first-time earners in tier-2 Indian cities.",
    location: "Jaipur, Rajasthan, India",
  },
  {
    name: "Manish Tiwari",
    email: "manish.tiwari@growhive.demo",
    headline: "Founder, building in edtech",
    bio: "Building a vernacular-language test-prep platform for competitive government exams.",
    location: "Lucknow, Uttar Pradesh, India",
  },
  {
    name: "Sonal Ghosh",
    email: "sonal.ghosh@growhive.demo",
    headline: "Founder, building in healthtech",
    bio: "Building a teleconsultation platform connecting rural patients with specialist doctors.",
    location: "Kolkata, West Bengal, India",
  },
];

const ROLE_GROUPS = [
  { role: "freelancer", accounts: FREELANCERS },
  { role: "job_seeker", accounts: JOB_SEEKERS },
  { role: "influencer", accounts: INFLUENCERS },
  { role: "employer", accounts: EMPLOYERS },
  { role: "investor", accounts: INVESTORS },
  { role: "mentor", accounts: MENTORS },
  { role: "partner", accounts: PARTNERS },
  { role: "client", accounts: CLIENTS },
  { role: "brand", accounts: BRANDS },
  { role: "agency", accounts: AGENCIES },
  { role: "talent_partner", accounts: TALENT_PARTNERS },
  { role: "founder", accounts: FOUNDERS },
];

async function upsertUser(data, role) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`Reusing existing ${role}: ${data.name}`);
    return { user: existing, created: false };
  }
  const user = new User({ ...data, role, password: DEMO_PASSWORD, isEmailVerified: true, isProfileComplete: true });
  await user.save();
  console.log(`Created ${role}: ${data.name} (${data.email})`);
  return { user, created: true };
}

async function run() {
  assertNotProduction("seedFreshRoleAccounts");
  await connectDB();

  let createdCount = 0;
  let reusedCount = 0;

  for (const { role, accounts } of ROLE_GROUPS) {
    for (const account of accounts) {
      // eslint-disable-next-line no-await-in-loop
      const { created } = await upsertUser(account, role);
      if (created) createdCount++;
      else reusedCount++;
    }
  }

  console.log(`\nDone — ${createdCount} created, ${reusedCount} reused (${createdCount + reusedCount} total across 12 roles).`);
  console.log(`Login password for every account: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
