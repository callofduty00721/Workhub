import { Link } from "react-router-dom";
import { Linkedin, Twitter, Facebook, Instagram, Youtube, Send } from "lucide-react";
import { Logo } from "./Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  {
    title: "Platform",
    links: ["Startups", "Freelancers", "Jobs", "Investors", "Mentors"],
  },
  {
    title: "Company",
    links: ["About Us", "Blog", "Careers", "Contact Us", "FAQs"],
  },
  {
    title: "Legal",
    links: ["Terms & Conditions", "Privacy Policy", "Refund Policy", "Pricing"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Empowering India&apos;s multi-state talent ecosystem.</p>
          <div className="mt-5 flex items-center gap-3">
            <p className="w-full text-sm font-semibold text-foreground">Follow Us</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            {[Facebook, Twitter, Linkedin, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <Link to="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-4 text-sm font-semibold text-foreground">Subscribe to our newsletter</h4>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input placeholder="Enter your email" />
            <Button variant="default" size="icon" type="submit" aria-label="Subscribe">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} MahaHub. All rights reserved.</p>
          <p>Made with care, for builders everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
