import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Logo } from "./Logo";
import { publicSettingsApi } from "@/api/settings";

const BASE_PLATFORM_LINKS = [
  { label: "Startups", to: "/startups" },
  { label: "Freelancers", to: "/freelancers" },
  { label: "Investors", to: "/investors" },
  { label: "Mentors", to: "/mentors" },
];

const OTHER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "FAQs", to: "/#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Refund Policy", to: "/refund" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
];

export function Footer() {
  // Same public, not-admin-gated read of the Jobs kill-switch as
  // Navbar.tsx — the "Jobs" link only appears once /jobs actually works,
  // instead of sending visitors to a 404 while the feature is off.
  const { data: jobsEnabled } = useQuery({
    queryKey: ["settings", "jobs-enabled"],
    queryFn: publicSettingsApi.jobsEnabled,
    staleTime: 60 * 1000,
  });
  const platformLinks = jobsEnabled ? [...BASE_PLATFORM_LINKS, { label: "Jobs", to: "/jobs" }] : BASE_PLATFORM_LINKS;
  const columns = [{ title: "Platform", links: platformLinks }, ...OTHER_COLUMNS];

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm text-[#6B7280]">Empowering India&apos;s multi-state talent ecosystem.</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-semibold text-[#111111]">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-[#6B7280] transition-colors hover:text-[#3F6212]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-4 text-sm font-semibold text-[#111111]">Subscribe to our newsletter</h4>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              placeholder="Enter your email"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#B6FF00] text-[#111111] transition-opacity hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB]">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-[#9CA3AF] sm:flex-row">
          <p>© {new Date().getFullYear()} GrowHive. All rights reserved.</p>
          <p>Made with care, for builders everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
