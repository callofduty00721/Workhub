export const HOME_STATS = [
  { label: "Startups", value: "12,000+", icon: "rocket" as const, color: "bg-primary/10 text-primary" },
  { label: "Freelancers", value: "9,500+", icon: "users" as const, color: "bg-secondary/10 text-secondary" },
  { label: "Jobs Posted", value: "6,000+", icon: "briefcase" as const, color: "bg-warning/10 text-warning" },
  { label: "Investors", value: "3,000+", icon: "handshake" as const, color: "bg-blue-500/10 text-blue-600" },
  { label: "Community Members", value: "80,000+", icon: "heart" as const, color: "bg-pink-500/10 text-pink-600" },
];

export const CATEGORIES = ["SaaS", "AI / ML", "FinTech", "HealthTech", "AgriTech", "EdTech", "E-commerce", "Climate"];

// Freelancer gig category/sub-category taxonomy — modeled on Fiverr's category
// structure (Category -> Sub-category groups), kept separate from CATEGORIES
// (legacy flat list) and from INDUSTRY_SUBCATEGORIES (used for startups).
export const SERVICE_CATEGORIES: Record<string, string[]> = {
  "Graphics & Design": [
    "Logo & Brand Identity",
    "Art & Illustration",
    "Web & App Design",
    "Product & Gaming",
    "Print Design",
    "Visual Design",
    "Marketing Design",
    "Packaging & Covers",
    "Architecture & Building Design",
    "Fashion & Merchandise",
    "3D Design",
  ],
  "Programming & Tech": [
    "Website Development",
    "Website Platforms",
    "Website Maintenance",
    "AI Development",
    "Chatbot Development",
    "Game Development",
    "Mobile App Development",
    "Cloud & Cybersecurity",
    "Data Science & ML",
    "Software Development",
    "Blockchain & Cryptocurrency",
  ],
  "Digital Marketing": [
    "Search",
    "Social",
    "Methods & Techniques",
    "Analytics & Strategy",
    "Channel Specific",
    "Industry & Purpose-Specific",
  ],
  "Video & Animation": [
    "Editing & Post-Production",
    "Social & Marketing Videos",
    "Animation",
    "Motion Graphics",
    "Filmed Video Production",
    "Explainer Videos",
    "Product Videos",
    "AI Video",
  ],
  "Writing & Translation": [
    "Content Writing",
    "Editing & Critique",
    "Book & eBook Publishing",
    "Career Writing",
    "Business & Marketing Copy",
    "Translation & Transcription",
    "Industry Specific Content",
  ],
  "Music & Audio": [
    "Music Production & Writing",
    "Audio Engineering & Post Production",
    "Voice Over & Narration",
    "Streaming & Audio",
    "DJing",
    "Sound Design",
    "Lessons & Transcriptions",
  ],
  Business: [
    "Financial Services",
    "Legal Services",
    "Business Management",
    "AI for Businesses",
    "E-Commerce Management",
    "Data & Business Intelligence",
    "Sales & Customer Care",
    "General & Administrative",
  ],
  Consulting: [
    "Business Consultants",
    "Marketing Strategy",
    "Data Consulting",
    "Coaching & Advice",
    "Tech Consulting",
    "Mentorship",
  ],
  "AI Services": ["AI Development", "Data", "AI Artists", "AI for Businesses", "AI Video", "AI Audio", "AI Content"],
  "Personal Growth": ["Self Improvement", "Fashion & Style", "Wellness & Fitness", "Gaming", "Leisure & Hobbies"],
  Photography: [
    "Product Photography",
    "Portrait Photography",
    "Lifestyle Photography",
    "Real Estate Photography",
    "Event Photography",
    "Drone Photography",
    "Photo Editing & Retouching",
  ],
  Data: [
    "Data Analysis & Reports",
    "Data Visualization",
    "Data Engineering",
    "Data Extraction & Web Scraping",
    "Data Cleaning",
    "Data Entry",
  ],
};

export const SERVICE_CATEGORY_NAMES = Object.keys(SERVICE_CATEGORIES);

// Startup industry/sector taxonomy — kept separate from CATEGORIES (used for
// freelancer service categories) since the two lists serve different purposes.
// Order here is intentional grouping (related sectors adjacent), not alphabetical.
export const INDUSTRY_SUBCATEGORIES: Record<string, string[]> = {
  "Information Technology (IT)": ["Software Development", "Web Development", "Mobile App Development", "Cloud Computing", "DevOps"],
  "Artificial Intelligence (AI)": ["Machine Learning", "Generative AI", "Computer Vision", "NLP", "AI Automation"],
  "Software / SaaS": ["CRM", "ERP", "HRMS", "Accounting Software", "Project Management"],
  FinTech: ["Digital Payments", "Lending", "Wealth Management", "Personal Finance", "Stock Trading"],
  Banking: ["Core Banking", "Neo Banking", "Credit Services", "Micro Finance", "Financial Inclusion"],
  InsurTech: ["Health Insurance", "Vehicle Insurance", "Life Insurance", "Claim Automation", "Risk Analytics"],
  EdTech: ["Online Learning", "LMS", "Skill Development", "Test Preparation", "Language Learning"],
  HealthTech: ["Telemedicine", "Health Records", "Hospital Management", "Digital Health", "Health Monitoring"],
  MedTech: ["Medical Devices", "Diagnostics", "Wearables", "Imaging", "Surgical Equipment"],
  BioTech: ["Biotechnology", "Genetics", "Agriculture Biotechnology", "Research", "Bioinformatics"],
  AgriTech: ["Precision Farming", "Dairy", "Poultry", "Fisheries", "Smart Irrigation"],
  FoodTech: ["Food Delivery", "Cloud Kitchen", "Restaurant Tech", "Grocery Delivery", "Meal Planning"],
  "Food & Beverage": ["Packaged Food", "Organic Food", "Beverages", "Bakery", "Snacks"],
  "E-commerce": ["Marketplace", "D2C", "B2B Commerce", "Social Commerce", "Wholesale"],
  Retail: ["Retail POS", "Fashion Retail", "Electronics Retail", "Grocery Retail", "Omnichannel"],
  Logistics: ["Freight", "Courier", "Last Mile Delivery", "Warehouse", "Fleet Management"],
  "Supply Chain": ["Procurement", "Inventory", "Distribution", "Cold Chain", "SCM Software"],
  Manufacturing: ["Smart Factory", "CNC", "Industrial Automation", "Plastic", "Metal"],
  Automobile: ["Car Manufacturing", "Two Wheeler", "Commercial Vehicle", "Auto Components", "Vehicle Services"],
  "Electric Vehicles (EV)": ["EV Charging", "Battery Technology", "Electric Bikes", "Electric Cars", "Battery Swapping"],
  "Renewable Energy": ["Solar", "Wind", "Hydro", "Biomass", "Energy Storage"],
  CleanTech: ["Carbon Capture", "Water Purification", "Pollution Control", "Green Energy", "Sustainability"],
  Construction: ["Building Materials", "Smart Construction", "Civil Engineering", "Infrastructure", "Contractors"],
  PropTech: ["Property Listing", "Smart Homes", "Real Estate CRM", "Rental Platform", "Property Management"],
  "Smart City": ["Traffic Management", "Smart Lighting", "Smart Parking", "IoT Infrastructure", "Public Safety"],
  Telecom: ["5G", "Internet Provider", "Fiber Network", "VoIP", "Communication Solutions"],
  Cybersecurity: ["Network Security", "Cloud Security", "Identity Management", "Ethical Hacking", "SOC"],
  Blockchain: ["Crypto", "Smart Contracts", "Web3", "NFT", "Tokenization"],
  IoT: ["Smart Home", "Industrial IoT", "Agriculture IoT", "Wearables", "Connected Devices"],
  Robotics: ["Industrial Robots", "Service Robots", "Medical Robots", "Automation", "Robotic Arms"],
  DroneTech: ["Agriculture Drone", "Survey Drone", "Delivery Drone", "Inspection", "Mapping"],
  SpaceTech: ["Satellite", "Space Research", "Launch Services", "GIS", "Space Data"],
  HRTech: ["Recruitment", "Payroll", "Attendance", "Employee Engagement", "Performance Management"],
  LegalTech: ["Contract Management", "Legal Research", "Compliance", "e-Signature", "Legal Automation"],
  TravelTech: ["Hotel Booking", "Flight Booking", "Tour Packages", "Travel Planning", "Visa Services"],
  Hospitality: ["Hotels", "Resorts", "Homestays", "Event Venues", "Restaurant Management"],
  Fashion: ["Clothing", "Footwear", "Accessories", "Designer Wear", "Sustainable Fashion"],
  Beauty: ["Cosmetics", "Skincare", "Haircare", "Salon Tech", "Personal Care"],
  Media: ["News", "Publishing", "Digital Media", "Podcast", "Streaming"],
  Entertainment: ["OTT", "Movies", "Music", "Celebrity Platform", "Live Streaming"],
  Gaming: ["Mobile Games", "PC Games", "Console Games", "Game Studio", "Game Engine"],
  Esports: ["Tournament", "Gaming Community", "Live Streaming", "Team Management", "Coaching"],
  SportsTech: ["Fitness Tracking", "Sports Analytics", "Coaching Platform", "Sports Equipment", "Athlete Management"],
  "Creator Economy": ["Influencer Tools", "Video Platform", "Creator Marketplace", "Monetization", "Fan Engagement"],
  "Digital Marketing": ["SEO", "SEM", "Social Media", "Email Marketing", "Marketing Automation"],
  "Event Management": ["Ticketing", "Virtual Events", "Wedding Planning", "Conference", "Event Software"],
  "Waste Management": ["Recycling", "Plastic Waste", "E-Waste", "Compost", "Circular Economy"],
  Pharma: ["Drug Manufacturing", "Pharmacy", "Clinical Research", "API Manufacturing", "Healthcare Products"],
  Textile: ["Garments", "Yarn", "Fabric", "Textile Machinery", "Handloom"],
  Others: [
    "NGO / Social Impact",
    "Government Services (GovTech)",
    "Import & Export",
    "Mining",
    "Pet Care",
    "Home Services",
    "Chemical Industry",
    "Furniture",
    "Consumer Electronics",
    "Miscellaneous",
  ],
};

export const INDUSTRIES = Object.keys(INDUSTRY_SUBCATEGORIES);

export const CATEGORY_GRID = [
  { label: "Web Dev", icon: "code" as const },
  { label: "Mobile App", icon: "smartphone" as const },
  { label: "UI/UX Design", icon: "palette" as const },
  { label: "Digital Marketing", icon: "megaphone" as const },
  { label: "AI & ML", icon: "brain" as const },
  { label: "Data Science", icon: "bar-chart" as const },
  { label: "Video & Anim.", icon: "video" as const },
  { label: "More", icon: "more" as const },
];

export const FEATURED_STARTUPS_FALLBACK = [
  {
    _id: "demo-1",
    name: "StreamLine",
    tagline: "Streamlining logistics for a better tomorrow.",
    industry: "Logistics",
    stage: "series_a" as const,
    fundingCr: 5.2,
    tags: ["Logistics", "Series A"],
    verified: true,
  },
  {
    _id: "demo-2",
    name: "MedEzy",
    tagline: "Making healthcare accessible for all.",
    industry: "HealthTech",
    stage: "seed" as const,
    fundingCr: 3.1,
    tags: ["HealthTech", "Seed"],
    verified: true,
  },
  {
    _id: "demo-3",
    name: "FinMate",
    tagline: "Smart finance management for everyone.",
    industry: "FinTech",
    stage: "pre_seed" as const,
    fundingCr: 1.8,
    tags: ["FinTech", "Pre-Seed"],
    verified: true,
  },
  {
    _id: "demo-4",
    name: "EcoKart",
    tagline: "Sustainable shopping for a greener planet.",
    industry: "E-Commerce",
    stage: "seed" as const,
    fundingCr: 4.6,
    tags: ["E-Commerce", "Seed"],
    verified: true,
  },
];

export const TOP_FREELANCERS_PREVIEW = [
  { name: "Rohit Sharma", role: "Full Stack Developer", rating: 4.9, reviews: 128, rate: "₹1500/hr" },
  { name: "Anjali Verma", role: "UI/UX Designer", rating: 4.8, reviews: 96, rate: "₹1200/hr" },
  { name: "Aman Khan", role: "Graphic Designer", rating: 4.7, reviews: 88, rate: "₹1000/hr" },
];

export const LATEST_JOBS_PREVIEW = [
  { title: "Frontend Developer", company: "TechNova Pvt. Ltd.", location: "Bangalore", type: "Full Time" },
  { title: "Digital Marketing Executive", company: "Growthify", location: "Mumbai", type: "Remote" },
  { title: "Data Analyst", company: "Insight Analytics", location: "Pune", type: "Full Time" },
];

export const TOP_PEOPLE_PREVIEW = [
  { name: "Vikas Bansal", role: "Angel Investor", rating: 4.9 },
  { name: "Neha Singh", role: "Growth Mentor", rating: 4.8 },
  { name: "Arjun Mehta", role: "Venture Capitalist", rating: 4.9 },
];

export const TESTIMONIALS = [
  {
    name: "Aditya Shelke",
    role: "Founder, EcoBin",
    quote:
      "MahaHub connected us with our lead investor within three weeks of listing our startup. The platform genuinely understands what early founders need.",
  },
  {
    name: "Priya Deshmukh",
    role: "Freelance Product Designer",
    quote:
      "I've booked more consistent design work through MahaHub than any other platform — the client quality is noticeably higher.",
  },
  {
    name: "Rohit Singh",
    role: "Investor, BlueLeaf Capital",
    quote: "The deal flow here is curated and founder profiles are detailed enough to make first-pass decisions fast.",
  },
];

export const PARTNER_LOGOS = ["Startup India", "NASSCOM", "T-Hub", "AWS Activate", "Google for Startups", "YCombinator SUp"];
