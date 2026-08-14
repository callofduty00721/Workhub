import mongoose from "mongoose";

// "freelance" intentionally excluded — that's Project.js territory now (bid-based work).
const JOB_TYPES = ["full_time", "part_time", "contract", "internship"];
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"];
const VISIBILITY_VALUES = ["public", "invite_only"];
const JOB_CATEGORIES = [
  "IT & Software",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "HR",
  "Operations",
  "Customer Support",
  "Engineering",
  "Legal",
  "Other",
];
// Same "Company Type" categories naukri.com's job filter uses.
const COMPANY_TYPES = ["Corporate", "Startup", "Foreign MNC", "Indian MNC", "Others"];
// Naukri.com-style industry -> sub-industry map (user-supplied list).
const SUB_INDUSTRIES = {
  "Information Technology": [
    "Software Development",
    "SaaS",
    "IT Services",
    "Cloud Computing",
    "AI & Machine Learning",
    "Data Science & Analytics",
    "Cybersecurity",
    "Web Development",
    "Mobile App Development",
    "IT Support",
    "Networking",
    "Blockchain & Web3",
  ],
  Telecommunications: ["Telecom Services", "Mobile Networks", "Internet Services", "Fiber & Broadband", "Network Infrastructure", "Satellite Communication"],
  "Banking & Finance": [
    "Commercial Banking",
    "Investment Banking",
    "NBFC",
    "Microfinance",
    "FinTech",
    "Payments",
    "Stock Broking",
    "Wealth Management",
    "Asset Management",
  ],
  Insurance: ["Life Insurance", "Health Insurance", "General Insurance", "Reinsurance", "Insurance Broking", "InsurTech"],
  "Accounting & Auditing": ["Accounting Services", "Taxation", "Auditing", "Bookkeeping", "Financial Advisory", "Payroll Services"],
  Healthcare: ["Hospitals", "Clinics", "Diagnostics", "Nursing", "Healthcare Services", "HealthTech", "Elder Care", "Dental Care"],
  Pharmaceuticals: ["Pharmaceutical Manufacturing", "Generic Drugs", "Biotechnology", "Clinical Research", "Drug Distribution", "Pharma Retail"],
  "Medical & Biotechnology": ["Medical Devices", "Biotechnology", "Laboratory Services", "Medical Research", "Life Sciences", "Genomics"],
  Education: ["Schools", "Colleges & Universities", "Coaching", "EdTech", "Vocational Training", "Skill Development", "Online Education"],
  Manufacturing: ["Industrial Manufacturing", "Machinery", "Electrical Equipment", "Electronics Manufacturing", "Factory Operations", "Industrial Automation"],
  Automobile: ["Passenger Vehicles", "Commercial Vehicles", "Electric Vehicles", "Auto Components", "Automobile Services", "Automotive Technology"],
  Electronics: ["Consumer Electronics", "Semiconductors", "Embedded Systems", "Electronic Components", "Consumer Appliances"],
  "Textiles & Apparel": ["Textile Manufacturing", "Garments", "Fashion", "Spinning", "Weaving", "Dyeing", "Footwear", "Leather"],
  Chemicals: ["Specialty Chemicals", "Industrial Chemicals", "Petrochemicals", "Paints & Coatings", "Fertilizers", "Chemical Manufacturing"],
  "Food & Beverage": ["Food Processing", "Dairy", "Beverages", "Bakery", "Packaged Foods", "Restaurants", "Food Distribution"],
  Agriculture: ["Farming", "Agribusiness", "AgriTech", "Seeds", "Fertilizers", "Agricultural Equipment", "Organic Farming"],
  "Dairy & Animal Husbandry": ["Dairy Farming", "Milk Processing", "Poultry", "Livestock", "Animal Feed", "Veterinary Services"],
  Construction: ["Residential Construction", "Commercial Construction", "Infrastructure", "Civil Engineering", "Construction Services"],
  "Real Estate": ["Property Development", "Property Management", "Commercial Real Estate", "Residential Real Estate", "Real Estate Brokerage"],
  "Architecture & Design": ["Architecture", "Interior Design", "Landscape Design", "Urban Planning", "Product Design"],
  Retail: ["Supermarkets", "Department Stores", "Fashion Retail", "Electronics Retail", "Jewellery Retail", "FMCG Retail"],
  "E-commerce": ["Online Marketplace", "D2C", "Online Retail", "E-commerce Operations", "E-commerce Logistics"],
  FMCG: ["Personal Care", "Home Care", "Food Products", "Beverages", "Consumer Products"],
  "Logistics & Supply Chain": ["Logistics", "Warehousing", "Supply Chain Management", "Freight", "Courier & Delivery", "3PL"],
  Transportation: ["Road Transport", "Rail Transport", "Public Transport", "Fleet Management", "Taxi & Mobility"],
  "Aviation & Aerospace": ["Airlines", "Airports", "Aviation Services", "Aerospace Manufacturing", "Aircraft Maintenance"],
  "Shipping & Maritime": ["Shipping", "Ports", "Marine Services", "Shipbuilding", "Cargo & Freight"],
  "Travel & Tourism": ["Travel Agencies", "Tour Operators", "Tourism Services", "Travel Technology", "Adventure Tourism"],
  Hospitality: ["Hotels", "Resorts", "Restaurants", "Catering", "Food Services", "Guest Services"],
  "Media & Entertainment": ["Film & TV", "Music", "Digital Media", "News", "Publishing", "Content Production"],
  Gaming: ["Game Development", "Mobile Gaming", "PC Gaming", "Console Gaming", "Esports"],
  "Animation & VFX": ["Animation", "VFX", "3D Design", "Motion Graphics", "Game Art"],
  "Advertising & Marketing": ["Advertising", "Digital Marketing", "SEO", "Social Media Marketing", "Content Marketing", "Performance Marketing"],
  "Public Relations": ["PR Agencies", "Corporate Communications", "Media Relations", "Brand Communications"],
  "Human Resources": ["Recruitment", "Staffing", "HR Consulting", "Payroll", "Learning & Development"],
  "BPO & KPO": ["Customer Support", "Call Centers", "Data Processing", "Back Office", "Knowledge Services", "Technical Support"],
  Consulting: ["Management Consulting", "IT Consulting", "Financial Consulting", "HR Consulting", "Business Consulting"],
  "Legal Services": ["Corporate Law", "Litigation", "Legal Consulting", "Intellectual Property", "Compliance"],
  Energy: ["Power Generation", "Power Distribution", "Renewable Energy", "Solar Energy", "Wind Energy"],
  "Oil & Gas": ["Exploration", "Refining", "Petroleum Products", "Oilfield Services", "Gas Distribution"],
  "Mining & Metals": ["Mining", "Steel", "Aluminium", "Copper", "Mineral Processing", "Metal Manufacturing"],
  "Environmental Services": ["Waste Management", "Recycling", "Water Treatment", "Environmental Consulting", "Sustainability"],
  "Government & Public Administration": ["Central Government", "State Government", "Local Government", "Public Administration", "Public Services"],
  "Defence & Security": ["Defence", "Military Services", "Aerospace Defence", "Private Security", "Security Technology"],
  "NGO & Social Services": ["NGOs", "Social Development", "Community Services", "Non-Profit Organizations", "Humanitarian Services"],
  "Fitness & Wellness": ["Gyms", "Fitness Centers", "Yoga", "Wellness", "Sports Training", "Nutrition"],
  "Beauty & Personal Care": ["Beauty Salons", "Cosmetics", "Skincare", "Haircare", "Personal Grooming"],
  "Fashion & Lifestyle": ["Fashion Design", "Luxury Goods", "Lifestyle Products", "Accessories", "Fashion Retail"],
  "Jewellery & Gems": ["Jewellery Manufacturing", "Jewellery Retail", "Gemstones", "Diamond Industry"],
  "Printing & Publishing": ["Printing", "Digital Printing", "Book Publishing", "Newspaper Publishing", "Packaging Printing"],
  Packaging: ["Flexible Packaging", "Paper Packaging", "Plastic Packaging", "Industrial Packaging"],
  "Furniture & Home": ["Furniture Manufacturing", "Home Decor", "Modular Furniture", "Woodworking", "Interior Products"],
  "Facility Management": ["Building Management", "Housekeeping", "Maintenance", "Property Services"],
  "Security Services": ["Security Guards", "Surveillance", "CCTV", "Security Systems", "Risk Management"],
  "Home Services": ["Cleaning", "Plumbing", "Electrical Services", "Repair & Maintenance", "Home Improvement"],
  "Import & Export": ["Import Trading", "Export Trading", "International Trade", "Customs & Compliance"],
  "Wholesale & Distribution": ["FMCG Distribution", "Industrial Distribution", "Pharmaceutical Distribution", "Consumer Goods Distribution"],
  "Research & Development": ["Scientific Research", "Industrial R&D", "Product Research", "Market Research"],
  "Professional Services": ["Business Services", "Documentation", "Translation", "Outsourcing", "Administrative Services"],
  Other: ["Other Industries", "General Services"],
};
const INDUSTRY_TYPES = Object.keys(SUB_INDUSTRIES);

const jobSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Snapshotted from employer.company at creation time — lets any teammate in
    // the same company manage this job, not just the person who posted it.
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true },
    description: { type: String, required: true },
    responsibilities: { type: String, default: "" },
    requirements: { type: String, default: "" },
    type: { type: String, enum: JOB_TYPES, default: "full_time" },
    category: { type: String, enum: JOB_CATEGORIES, required: true, default: "Other" },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: "entry" },
    // Extra classification fields shown on the job's detail page (role
    // overview grid) — all optional free text since they're descriptive
    // metadata, not filters, and existing jobs won't have them backfilled.
    role: { type: String, default: "" },
    industryType: { type: String, enum: [...INDUSTRY_TYPES, ""], default: "" },
    // Not enum-constrained at the schema level — valid values depend on
    // industryType (see SUB_INDUSTRIES above), same pattern as Freelancer's
    // category/subCategory.
    subIndustry: { type: String, default: "" },
    companyType: { type: String, enum: [...COMPANY_TYPES, ""], default: "" },
    department: { type: String, default: "" },
    roleCategory: { type: String, default: "" },
    educationUG: { type: String, default: "" },
    educationPG: { type: String, default: "" },
    openings: { type: Number, default: 0 },
    skills: [{ type: String }],
    location: { type: String, required: true },
    isRemote: { type: Boolean, default: false },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    applicationsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    // Private/NDA project support — "invite_only" jobs are hidden from public
    // listing/search and only visible to the employer, admins, and the
    // freelancers explicitly invited below.
    visibility: { type: String, enum: VISIBILITY_VALUES, default: "public" },
    invitedFreelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requiresNda: { type: Boolean, default: false },
    ndaText: { type: String, default: "" },
    ndaAcceptances: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        acceptedAt: { type: Date, default: Date.now },
      },
    ],
    // Attachments are stored by R2 object key, never a public URL — access is
    // only ever granted through a short-lived signed URL after the viewer
    // passes the visibility + NDA checks (see jobController.getAttachmentUrl).
    attachments: [{ key: { type: String, required: true }, name: { type: String, default: "" } }],
    // Internal moderation data — never selected/returned in any public-facing query.
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", companyName: "text", skills: "text" });
// Matches listJobs' actual filter+sort: { status, visibility } narrowed down,
// then sorted newest-first — without this, that sort forces a full collection
// scan once the Jobs collection grows past a trivial size.
jobSchema.index({ status: 1, visibility: 1, createdAt: -1 });
// The employer's own listings page filters by employer + status.
jobSchema.index({ employer: 1, status: 1 });

export const JOB_TYPE_VALUES = JOB_TYPES;
export const JOB_CATEGORY_VALUES = JOB_CATEGORIES;
export const EXPERIENCE_LEVEL_VALUES = EXPERIENCE_LEVELS;
export const COMPANY_TYPE_VALUES = COMPANY_TYPES;
export const INDUSTRY_TYPE_VALUES = INDUSTRY_TYPES;
export const SUB_INDUSTRIES_MAP = SUB_INDUSTRIES;
export const VISIBILITY_VALUES_EXPORT = VISIBILITY_VALUES;
export default mongoose.model("Job", jobSchema);
