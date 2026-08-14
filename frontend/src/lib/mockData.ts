export const CATEGORIES = ["SaaS", "AI / ML", "FinTech", "HealthTech", "AgriTech", "EdTech", "E-commerce", "Climate"];

// Freelancer gig category taxonomy — our own original 3-level browse
// structure (Category -> Section -> specific skill), kept separate from
// CATEGORIES (legacy flat list) and from INDUSTRY_SUBCATEGORIES (startups).
// Section headers are visual groupings only — the leaf skill names are the
// actual selectable/filterable sub-category values (see SERVICE_SUBCATEGORIES
// below), same field freelancer profiles and gigs already store.
export const SERVICE_CATEGORIES: Record<string, Record<string, string[]>> = {
  "Graphics & Design": {
    "Branding & Identity": ["Logo Design", "Brand Identity", "Business Card Design", "Brand Guidelines"],
    "Illustration & Art": ["Illustration", "Character Design", "Portrait Art", "Tattoo Design"],
    "UI/UX & Web Design": ["Website Design", "Mobile App Design", "Landing Page Design", "UX Research"],
    "Print & Packaging": [
      "Packaging Design",
      "Brochure Design",
      "Flyer Design",
      "Book Cover Design",
      "T-shirt & Merchandise Design",
      "Invitation & Greeting Card Design",
    ],
    "3D & Motion": ["3D Modeling", "3D Product Rendering", "Motion Graphics"],
    "Marketing & Social Media Design": [
      "Social Media Post Design",
      "Banner & Ad Design",
      "Infographic Design",
      "Presentation Design",
    ],
  },
  "Programming & Tech": {
    "Web Development": [
      "Frontend Development",
      "Backend Development",
      "Full-Stack Development",
      "CMS Development",
      "API Development & Integrations",
    ],
    "Mobile Development": ["iOS App Development", "Android App Development", "Cross-Platform Apps"],
    "Data & AI": ["Data Science", "Machine Learning", "AI Model Integration", "Data Engineering"],
    "Infrastructure & Security": [
      "Cloud Architecture",
      "DevOps",
      "Cybersecurity Audits",
      "QA & Testing",
      "Bug Fixes & Technical Support",
    ],
    "Emerging Tech": ["Blockchain Development", "Smart Contracts", "Game Development", "AR/VR Development", "Browser Extension Development"],
    "Desktop Software Development": ["Windows App Development", "macOS App Development", "Cross-Platform Desktop Apps"],
    "Automation & Scripting": ["Process Automation (RPA)", "Bot Development", "Script Writing"],
    "E-Commerce Development": [
      "Shopify Development",
      "WooCommerce Development",
      "Magento Development",
      "Custom Store Development",
    ],
  },
  "Digital Marketing": {
    "Search & SEO": ["SEO Audits", "Keyword Research", "Local SEO", "Technical SEO", "App Store Optimization (ASO)"],
    "Social Media": ["Social Media Management", "Social Media Ads", "Influencer Outreach"],
    "Paid Advertising": ["Google Ads", "Meta Ads", "YouTube Ads", "Ad Copywriting"],
    "Strategy & Analytics": ["Marketing Strategy", "Analytics & Reporting", "Conversion Optimization", "GA4 & Google Tag Manager Setup"],
    "Email & Automation": ["Email Marketing", "Marketing Automation", "Newsletter Design"],
    "Content & Affiliate Marketing": ["Content Marketing Strategy", "Affiliate Marketing", "Influencer Marketing"],
    "Marketplace & E-commerce Marketing": ["Amazon Marketing", "Flipkart Listing Optimization", "Marketplace Ads"],
  },
  "Video & Animation": {
    Editing: ["Video Editing", "Trailer Editing", "Podcast Video Editing", "Color Grading"],
    Animation: ["2D Animation", "3D Animation", "Whiteboard Animation", "Stop Motion Animation"],
    "Motion Design": ["Motion Graphics", "Logo Animation", "Title Sequences"],
    Production: ["Explainer Videos", "Product Demo Videos", "Corporate Videos", "Video Ads & Commercials"],
    Specialty: ["AI Video Generation", "VFX & Compositing"],
    "Social Media & Content Video": ["Reels & Shorts Editing", "YouTube Video Editing", "Subtitling & Captions"],
  },
  "Writing & Translation": {
    "Content Writing": ["Blog Writing", "Website Copy", "Article Writing"],
    "Editing & Proofreading": ["Copy Editing", "Proofreading", "Manuscript Critique"],
    "Business Writing": ["Resume Writing", "Cover Letters", "Business Proposals"],
    "Creative Writing": ["Ghostwriting", "Scriptwriting", "Book Writing"],
    Translation: ["Document Translation", "Localization", "Transcription", "Subtitle Translation"],
    "Technical & Specialized Writing": ["Technical Writing", "SEO Writing", "Academic Writing", "Grant Writing"],
  },
  "Music & Audio": {
    Production: ["Music Production", "Beat Making", "Mixing & Mastering", "DJ Mixing"],
    Voice: ["Voice Over", "Audiobook Narration", "Dubbing"],
    "Audio Post-Production": ["Sound Design", "Podcast Editing", "Audio Restoration", "Podcast Production"],
    Composition: ["Jingle Writing", "Film Scoring", "Session Musicians"],
    Lessons: ["Music Lessons", "Music Transcription"],
  },
  Business: {
    Finance: ["Bookkeeping", "Financial Modeling", "Tax Advisory"],
    Legal: ["Contract Drafting", "Trademark Filing", "Legal Consulting"],
    Operations: ["Business Planning", "Process Documentation", "Virtual Assistance", "Project Management"],
    "Sales & Support": ["Sales Strategy", "Customer Support Setup", "CRM Management"],
    "E-Commerce": ["Store Setup", "Inventory Management", "Marketplace Management"],
    "HR & Recruiting": ["Recruitment & Hiring", "HR Policy Consulting", "Resume Screening"],
  },
  Consulting: {
    Strategy: ["Business Strategy", "Market Research", "Growth Consulting"],
    Technology: ["Tech Stack Consulting", "Digital Transformation"],
    Coaching: ["Career Coaching", "Startup Mentorship", "Leadership Coaching"],
    Data: ["Data Strategy Consulting", "BI Dashboard Consulting"],
  },
  "AI Services": {
    Development: ["Custom AI Model Building", "Chatbot Development", "AI Integration", "LLM Fine-tuning"],
    Content: ["AI Art Generation", "AI Copywriting", "AI Video Generation", "AI Voice Cloning & Voiceover"],
    Data: ["AI Data Labeling", "Prompt Engineering"],
    "Business Use": ["AI Workflow Automation", "AI for Customer Support"],
  },
  "Personal Growth": {
    Wellness: ["Fitness Coaching", "Nutrition Planning", "Meditation Coaching"],
    Style: ["Personal Styling", "Wardrobe Consulting"],
    Learning: ["Life Coaching", "Skill Tutoring", "Test Prep & Exam Coaching", "Language Learning"],
    Leisure: ["Gaming Coaching", "Hobby Classes"],
  },
  Photography: {
    Commercial: ["Product Photography", "Real Estate Photography", "Event Photography"],
    Portrait: ["Portrait Photography", "Fashion Photography", "Wedding Photography"],
    Editing: ["Photo Retouching", "Photo Editing", "Photo Restoration"],
    Specialty: ["Drone Photography", "Food Photography"],
  },
  Data: {
    Analysis: ["Data Analysis", "Statistical Analysis", "Reporting Dashboards"],
    Engineering: ["Data Pipeline Engineering", "Database Design"],
    Collection: ["Web Scraping", "Data Entry", "Data Cleaning"],
    Visualization: ["Data Visualization", "Dashboard Design"],
  },
  "Architecture & Interior Design": {
    "Architectural Design": ["Building Design", "Floor Plans", "Site Planning", "Structural Layout"],
    "Interior Design": ["Residential Interior Design", "Commercial Interior Design", "Space Planning", "Furniture Layout"],
    "Visualization & Modeling": ["3D Architectural Rendering", "Virtual Walkthroughs", "CAD Drafting"],
    "Landscape & Outdoor": ["Landscape Design", "Garden Planning", "Outdoor Living Spaces"],
    Consultation: ["Vastu Consultation", "Renovation Planning", "Sustainable Design"],
  },
};

export const SERVICE_CATEGORY_NAMES = Object.keys(SERVICE_CATEGORIES);

// Flat category -> [skill] list, derived from SERVICE_CATEGORIES — every
// existing filter/form (freelancer profile, gig create/edit, list filters)
// only ever needed the leaf values, not the section groupings, so they keep
// working against this flattened view instead of the nested one above.
export const SERVICE_SUBCATEGORIES: Record<string, string[]> = Object.fromEntries(
  Object.entries(SERVICE_CATEGORIES).map(([category, sections]) => [category, Object.values(sections).flat()])
);

// Influencer niche taxonomy — simpler two-level (Category -> specific niches)
// than the freelancer one above, since influencer content categories don't
// need a middle grouping tier. Powers both the edit-profile Category/Niche
// selects and the /influencers directory filter pills.
// Mirrors YouTube's standard content-category taxonomy — the list creators
// already know from their own channel settings, so it reads as familiar
// rather than inventing a GrowHive-specific one.
export const INFLUENCER_CATEGORIES: Record<string, string[]> = {
  "Autos & Vehicles": ["Car Reviews", "Bike Modifications", "DIY Repair"],
  Comedy: ["Sketches", "Stand-up", "Parody"],
  Education: ["Academic Tutoring", "Competitive Exams", "Skill Development"],
  Entertainment: ["Reaction", "Celebrity & Pop Culture", "Web Series"],
  "Film & Animation": ["Short Films", "Animation", "Film Reviews"],
  Gaming: ["Let's Play", "Esports", "Game Reviews"],
  "Howto & Style": ["Makeup", "DIY", "Home Decor"],
  Music: ["Covers", "Original Music", "Music Reviews"],
  "News & Politics": ["Current Affairs", "Commentary", "Local News"],
  "Nonprofits & Activism": ["Social Causes", "Environment", "Community Work"],
  "People & Blogs": ["Vlogs", "Day in the Life", "Personal Stories"],
  "Pets & Animals": ["Pet Care", "Wildlife", "Training"],
  "Science & Technology": ["Gadget Reviews", "Software & Apps", "Science Explainers"],
  Sports: ["Fitness & Training", "Match Analysis", "Sports News"],
  "Travel & Events": ["Budget Travel", "Luxury Travel", "Local Guides"],
};

export const INFLUENCER_CATEGORY_NAMES = Object.keys(INFLUENCER_CATEGORIES);

// A brand's business categories (what it sells), distinct from
// INFLUENCER_CATEGORIES (what content a creator makes) — client-side taxonomy
// only, same convention as above, no backend enum so it can change without a
// migration. Brands can also add their own category beyond this list (see
// BrandDetailsSection.tsx) — publicProfile.controller.js's "other" filter is
// literally "anything not in this array", so keep the two in sync.
export const BRAND_CATEGORIES = [
  "Beauty & Personal Care",
  "Skincare",
  "Haircare",
  "Makeup",
  "Baby & Kids",
  "Fashion & Apparel",
  "Footwear",
  "Jewellery & Accessories",
  "Food & Beverage",
  "Health & Wellness",
  "Fitness & Nutrition",
  "Home & Living",
  "Electronics & Gadgets",
  "Automotive",
  "Travel & Hospitality",
  "Finance & Fintech",
  "Education & EdTech",
  "Gaming & Entertainment",
  "Pet Care",
  "Sustainability & Eco-friendly",
];

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

export const FAQS = [
  {
    question: "Is GrowHive free to use?",
    answer:
      "Yes — creating an account, listing a startup, browsing freelancers, and applying to jobs are all free. Paid plans add things like priority visibility, featured placement, and advanced analytics.",
  },
  {
    question: "How do I list my startup on GrowHive?",
    answer:
      "Sign up as a Founder, then go to your dashboard and select \"Post Startup.\" You'll walk through a guided form covering your story, team, funding needs, and product — it adapts to whichever stage you're at, from Idea to Series A.",
  },
  {
    question: "How does profile and startup verification work?",
    answer:
      "Founders and freelancers can submit KYC documents from their dashboard. Once reviewed by our team, verified profiles get a badge that's shown across the platform, which builds trust with investors and clients.",
  },
  {
    question: "Can I hire freelancers directly through the platform?",
    answer:
      "Yes. You can message freelancers directly, invite them to a project, or post a job/project and receive proposals. Payments and contracts are handled within GrowHive for a clear paper trail.",
  },
  {
    question: "What's the difference between Projects, Gigs, and Contests?",
    answer:
      "Projects are open briefs you post and collect proposals for. Gigs (Services) are fixed-scope packages freelancers sell directly. Contests let you crowdsource entries (like a logo or tagline) and pick a winner.",
  },
  {
    question: "How do I upgrade or cancel my plan?",
    answer:
      "Head to the Pricing page and choose a plan — payment is handled securely via Razorpay or Stripe. You can downgrade back to the Free plan at any time from your account settings.",
  },
];

// Generic, role-agnostic teaser shown on the homepage before anyone's picked
// a role — real, role-specific plans (fetched from the backend, editable by
// admins) only show up once a role is known, on the Pricing page itself. Not
// tied to the `Plan` type in @/types because that one always has a role.
export interface PricingTeaser {
  id: string;
  name: string;
  priceInInr: number;
  features: string[];
}

export const HOME_PRICING_TEASER: PricingTeaser[] = [
  { id: "free", name: "Free", priceInInr: 0, features: ["Basic listings", "Basic profile", "Community access"] },
  { id: "pro", name: "Pro", priceInInr: 299, features: ["Priority visibility", "Featured placement", "Basic analytics"] },
  {
    id: "enterprise",
    name: "Enterprise",
    priceInInr: 999,
    features: ["Unlimited listings", "Top placement", "Advanced analytics", "Priority support"],
  },
];
