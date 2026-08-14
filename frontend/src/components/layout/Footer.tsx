import { Link } from "react-router-dom";
import { Linkedin, Twitter, Facebook, Instagram, Youtube, Send } from "lucide-react";
import { Logo } from "./Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Startups", to: "/startups" },
      { label: "Freelancers", to: "/freelancers" },
      { label: "Jobs", to: "/jobs" },
      { label: "Investors", to: "/investors" },
      { label: "Mentors", to: "/mentors" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Blog", to: "#" },
      { label: "Careers", to: "#" },
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
  return (
    <footer className="border-t border-white/[0.08] bg-black">
      <div className="container grid gap-10 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            The startup ecosystem's own network — founders, freelancers, mentors, investors, and influencers, connected directly.
          </p>
          <div className="mt-6 flex items-center gap-2.5">
            {[Facebook, Twitter, Linkedin, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/50 transition-colors hover:border-[#22C55E]/40 hover:text-[#65d838]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-white/40">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-white/70 transition-colors hover:text-[#65d838]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-white/40">Stay in the loop</h4>
          <p className="mb-3 text-sm text-white/50">New opportunities, straight to your inbox.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              placeholder="Enter your email"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-[#65d838]"
            />
            <Button
              size="icon"
              type="submit"
              aria-label="Subscribe"
              className="shrink-0 bg-gradient-to-b from-[#E8FF25] to-[#22C55E] text-black hover:brightness-110"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/[0.08]">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} GrowHive. All rights reserved.</p>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
            </span>
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
