import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import User from "../../src/modules/shared/user.model.js";

const PASSWORD = "Demo@12345";

const INFLUENCERS = [
  {
    name: "Riya Kulkarni",
    email: "riya.influencer@mahahub.test",
    headline: "Sustainable fashion creator, styling budget-friendly outfits",
    location: "Pune, Maharashtra",
    bio: "I help people build a wardrobe that doesn't cost the planet — thrifted styling, upcycling tutorials, and honest reviews of sustainable brands.",
    influencerProfile: {
      category: "Fashion & Beauty",
      niche: "Sustainable Fashion",
      mediaKitUrl: "",
      avgEngagementRate: 6.4,
      platforms: [
        { platform: "Instagram", handle: "@riya.wears", followers: 84000, url: "https://instagram.com/riya.wears" },
        { platform: "YouTube", handle: "Riya Kulkarni", followers: 21000, url: "https://youtube.com/@riyakulkarni" },
      ],
      rateCard: [
        { platform: "Instagram", contentType: "Reel", priceInInr: 15000 },
        { platform: "Instagram", contentType: "Story (3-pack)", priceInInr: 5000 },
        { platform: "YouTube", contentType: "Dedicated video", priceInInr: 35000 },
      ],
      pastCollaborations: [
        { brandName: "EcoThread Apparel", description: "3-part thrifted styling series", resultMetric: "310K views, 8.1% engagement" },
        { brandName: "Nykaa Fashion", description: "Sustainable brands roundup reel", resultMetric: "180K views" },
      ],
      contentSamples: [
        { url: "https://instagram.com/reel/example-riya-1", caption: "5 thrifted outfits under ₹1000" },
        { url: "https://youtube.com/watch?v=example-riya-2", caption: "How I built a 30-piece capsule wardrobe" },
      ],
    },
  },
  {
    name: "Arjun Deshpande",
    email: "arjun.influencer@mahahub.test",
    headline: "Tech reviewer — smartphones, laptops, and everyday gadgets",
    location: "Bengaluru, Karnataka",
    bio: "Honest, no-sponsor-bias tech reviews. I buy most of what I review with my own money so I can say what I actually think.",
    influencerProfile: {
      category: "Technology",
      niche: "Gadget Reviews",
      mediaKitUrl: "",
      avgEngagementRate: 5.1,
      platforms: [
        { platform: "YouTube", handle: "Arjun Tech", followers: 142000, url: "https://youtube.com/@arjuntech" },
        { platform: "Instagram", handle: "@arjun.tech", followers: 38000, url: "https://instagram.com/arjun.tech" },
        { platform: "Twitter", handle: "@arjundeshtech", followers: 19500, url: "https://twitter.com/arjundeshtech" },
      ],
      rateCard: [
        { platform: "YouTube", contentType: "Dedicated review", priceInInr: 60000 },
        { platform: "YouTube", contentType: "Integration (60-90s)", priceInInr: 25000 },
        { platform: "Instagram", contentType: "Reel", priceInInr: 18000 },
      ],
      pastCollaborations: [
        { brandName: "Noise", description: "Smartwatch launch review", resultMetric: "500K views, featured on brand's own page" },
        { brandName: "boAt", description: "Earbuds comparison video", resultMetric: "2.1K affiliate conversions" },
      ],
      contentSamples: [
        { url: "https://youtube.com/watch?v=example-arjun-1", caption: "This ₹15,000 phone beats flagships — here's why" },
        { url: "https://instagram.com/reel/example-arjun-2", caption: "3 laptop mistakes students make" },
      ],
    },
  },
  {
    name: "Sanika Patil",
    email: "sanika.influencer@mahahub.test",
    headline: "Home cook sharing quick Maharashtrian recipes & food reviews",
    location: "Nashik, Maharashtra",
    bio: "Traditional recipes made simple for busy weeknights, plus honest reviews of home-grown food brands and local restaurants.",
    influencerProfile: {
      category: "Food & Cooking",
      niche: "Home Cooking",
      mediaKitUrl: "",
      avgEngagementRate: 7.8,
      platforms: [
        { platform: "Instagram", handle: "@sanikaskitchen", followers: 96000, url: "https://instagram.com/sanikaskitchen" },
        { platform: "YouTube", handle: "Sanika's Kitchen", followers: 12000, url: "https://youtube.com/@sanikaskitchen" },
      ],
      rateCard: [
        { platform: "Instagram", contentType: "Reel", priceInInr: 12000 },
        { platform: "Instagram", contentType: "Carousel post", priceInInr: 7000 },
      ],
      pastCollaborations: [
        { brandName: "Tata Sampann", description: "5-recipe series using their spice range", resultMetric: "420K combined views" },
        { brandName: "Zomato", description: "Local restaurant discovery series", resultMetric: "90K views, top comment engagement in category" },
      ],
      contentSamples: [
        { url: "https://instagram.com/reel/example-sanika-1", caption: "15-minute misal pav recipe" },
        { url: "https://youtube.com/watch?v=example-sanika-2", caption: "Testing 5 viral food brands from Instagram" },
      ],
    },
  },
];

async function run() {
  await connectDB();

  for (const data of INFLUENCERS) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      console.log(`"${data.name}" already exists — skipped.`);
      continue;
    }

    const influencer = await User.create({
      name: data.name,
      email: data.email,
      password: PASSWORD,
      role: "influencer",
      roles: ["influencer"],
      selectedCategory: "talent",
      headline: data.headline,
      location: data.location,
      bio: data.bio,
      influencerProfile: data.influencerProfile,
      isEmailVerified: true,
      isProfileComplete: true,
    });
    console.log(`Created "${influencer.name}" (${influencer._id})`);
  }

  console.log("\nDemo influencer logins (same password for all):");
  for (const data of INFLUENCERS) console.log(`  ${data.email}`);
  console.log(`  Password: ${PASSWORD}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
