import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  ArrowRight,
  Users,
  ShieldCheck,
  MessageSquare,
  Tag,
  Briefcase,
  Trophy,
  FolderKanban,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  Send,
  CalendarCheck,
  Upload,
  Eye,
  Award,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type SectionTab = "freelancers" | "services" | "projects" | "contests";

interface PremiumHeroProps {
  tab: SectionTab;
  search: string;
  setSearch: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  totalCount?: number;
}

// Real platform capabilities per tab — no fabricated numbers, and nothing
// claimed that the schema can't back up (e.g. projects are proposal/bid-based
// per application.model.js, so we say "set your own rate", not "no bidding").
const TRUST_POINTS_BY_TAB: Record<SectionTab, { icon: LucideIcon; label: string; color: string }[]> = {
  freelancers: [
    { icon: ShieldCheck, label: "Verified profiles", color: "text-green-500" },
    { icon: MessageSquare, label: "Direct messaging", color: "text-blue-500" },
    { icon: Tag, label: "Transparent rates", color: "text-purple-500" },
  ],
  services: [
    { icon: ShieldCheck, label: "Verified sellers", color: "text-green-500" },
    { icon: MessageSquare, label: "Direct messaging", color: "text-blue-500" },
    { icon: Tag, label: "Transparent pricing", color: "text-purple-500" },
  ],
  projects: [
    { icon: FolderKanban, label: "Real budgets", color: "text-sky-500" },
    { icon: Send, label: "Direct applications", color: "text-blue-500" },
    { icon: Tag, label: "Set your own rate", color: "text-purple-500" },
  ],
  contests: [
    { icon: Trophy, label: "Real prizes", color: "text-amber-500" },
    { icon: CalendarCheck, label: "Clear deadlines", color: "text-blue-500" },
    { icon: Upload, label: "Submit directly", color: "text-purple-500" },
  ],
};

// Copy + icon per tab — kept honest: a count only renders where the caller
// actually has a real number for that tab (freelancers, contests). Services
// and projects don't have a list-level total wired up yet, so their badge
// just names the section instead of guessing a number.
const TAB_CONTENT: Record<
  SectionTab,
  { icon: typeof Users; word: string; accent: string; description: string; searchPlaceholder: string; noun: string; processTitle: string }
> = {
  freelancers: {
    icon: Users,
    word: "Find talent that moves your",
    accent: "business forward",
    description: "Discover verified freelancers, specialists and creative professionals ready to work on your next project.",
    searchPlaceholder: "Search skills, services or freelancers...",
    noun: "freelancer",
    processTitle: "How hiring works",
  },
  services: {
    icon: Briefcase,
    word: "Find the right",
    accent: "service",
    description: "Ready-made gigs from freelancers who've already priced out the work — pick one and get started.",
    searchPlaceholder: "Search services...",
    noun: "service",
    processTitle: "How ordering a service works",
  },
  projects: {
    icon: FolderKanban,
    word: "Discover open",
    accent: "projects",
    description: "Real project briefs posted by founders and teams looking for someone to build with them.",
    searchPlaceholder: "Search projects...",
    noun: "project",
    processTitle: "How getting hired works",
  },
  contests: {
    icon: Trophy,
    word: "Join exciting",
    accent: "contests",
    description: "Compete on design and content briefs with real prizes, and get picked from real entries.",
    searchPlaceholder: "Search contests...",
    noun: "contest",
    processTitle: "How winning a contest works",
  },
};

// Each tab's real lifecycle — matches actual model fields, not a made-up flow:
// services -> order (orderStatus/deliverables/deliveredAt), projects ->
// application (ApplicationStatus: applied/shortlisted/interview/hired),
// contests -> entry (ContestEntry.isWinner). Colors cycle the same flat
// palette used for StartupList's stage journey — no gradients.
const STEP_COLORS = [
  { color: "#D97706", tint: "#FEF3C7" },
  { color: "#10B981", tint: "#ECFDF5" },
  { color: "#0284C7", tint: "#E0F2FE" },
  { color: "#9333EA", tint: "#F3E8FF" },
];

const HIRE_PROCESS = [
  { icon: Users, title: "Browse profiles", desc: "Real skills, real portfolios, real rates" },
  { icon: MessageSquare, title: "Message or hire", desc: "No bidding wars — reach out directly" },
  { icon: CalendarCheck, title: "Agree on scope", desc: "Discuss the work and timeline first" },
  { icon: CheckCircle2, title: "Work delivered", desc: "Track progress until you approve it" },
];

const SERVICE_PROCESS = [
  { icon: Search, title: "Browse services", desc: "Find a ready-made gig that fits" },
  { icon: ShoppingBag, title: "Choose & order", desc: "Pick a package and message the seller" },
  { icon: PackageCheck, title: "Get it delivered", desc: "Delivered by the agreed date" },
  { icon: CheckCircle2, title: "Review & release", desc: "Approve, or request a revision" },
];

const PROJECT_PROCESS = [
  { icon: FolderKanban, title: "Browse the brief", desc: "Real scope, budget, and timeline" },
  { icon: Send, title: "Apply with your rate", desc: "Submit a proposal and delivery time" },
  { icon: CalendarCheck, title: "Get shortlisted", desc: "The client reviews and reaches out" },
  { icon: CheckCircle2, title: "Get hired & start", desc: "Move from applicant to hired" },
];

const CONTEST_PROCESS = [
  { icon: Trophy, title: "Browse the brief", desc: "Real prize, deadline, requirements" },
  { icon: Upload, title: "Submit your entry", desc: "Upload your work before the deadline" },
  { icon: Eye, title: "Entries reviewed", desc: "Every real submission gets seen" },
  { icon: Award, title: "Winner gets the prize", desc: "Picked from real entries" },
];

const PROCESS_BY_TAB: Record<SectionTab, { icon: LucideIcon; title: string; desc: string }[]> = {
  freelancers: HIRE_PROCESS,
  services: SERVICE_PROCESS,
  projects: PROJECT_PROCESS,
  contests: CONTEST_PROCESS,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function PremiumHero({
  tab,
  search,
  setSearch,
  location,
  setLocation,
  handleSearch,
}: PremiumHeroProps) {
  const isFreelancers = tab === "freelancers";
  const content = TAB_CONTENT[tab];
  const steps = PROCESS_BY_TAB[tab];

  

  return (
    <>
      {/* Hero — premium dark SaaS: black backdrop, a neon glow blooming from
          the bottom edge, matching Home.tsx's hero language. Not full-screen
          tall — this is a sub-page hero with a job to do (search), not a
          landing statement. */}
      <section className="relative overflow-hidden bg-black pb-12 pt-14 sm:pb-16 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 bottom-0 h-[75%] bg-[radial-gradient(ellipse_65%_60%_at_50%_115%,rgba(34,197,94,0.4),transparent_70%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[radial-gradient(ellipse_45%_100%_at_50%_130%,rgba(232,255,37,0.22),transparent_70%)]" />
        </div>

        <motion.div initial="hidden" animate="show" variants={stagger} className="container flex flex-col items-center text-center">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/5 px-4 py-1.5 text-[12.5px] font-semibold text-[#A1A1AA]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            GrowHive Marketplace
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-5 max-w-2xl font-display text-4xl font-black leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl"
          >
            {content.word}{" "}
            <span className="bg-gradient-to-b from-[#E8FF25] to-[#22C55E] bg-clip-text text-transparent">{content.accent}</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 max-w-md text-[17px] leading-relaxed text-[#A1A1AA]">
            {content.description}
          </motion.p>

          {isFreelancers && (
            <motion.div variants={fadeUp} className="mt-6">
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/5 px-5 py-2 text-[13.5px] font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
              >
                Become a Freelancer <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          )}

          {/* Search bar — full featured on Freelancers, simple search elsewhere
              since category/location/budget only wire up to the freelancer query */}
          <motion.form
            variants={fadeUp}
            onSubmit={handleSearch}
            className="relative z-10 mt-8 w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-1.5 shadow-[0_0_0_1px_rgba(34,197,94,0.06),0_20px_60px_-20px_rgba(0,0,0,0.6)]"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-[1.4]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={content.searchPlaceholder}
                  className="h-11 border-0 bg-transparent pl-9 text-[15.5px] text-white shadow-none placeholder:text-[#71717A] focus-visible:ring-0"
                />
              </div>

              {isFreelancers && (
                <>
                  <div className="hidden h-6 w-px bg-white/[0.08] sm:block" />
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location"
                      className="h-11 border-0 bg-transparent pl-9 text-[15.5px] text-white shadow-none placeholder:text-[#71717A] focus-visible:ring-0"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#E8FF25] to-[#22C55E] px-5 text-[14.5px] font-semibold text-black transition-all hover:brightness-110"
              >
                Search
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.form>

          {(
            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {TRUST_POINTS_BY_TAB[tab].map((t) => (
                <span key={t.label} className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#A1A1AA]">
                  <t.icon className={`h-4 w-4 ${t.color}`} />
                  {t.label}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Process strip — real lifecycle for the active tab, matching
          StartupList's stage-journey icon strip. */}
      <section className="relative border-t border-white/[0.08] bg-black pb-10 pt-8 sm:pb-12">
        <div className="container">
          <h2 className="mb-8 text-center font-display text-[22px] font-black tracking-tight text-white sm:text-[25px]">
            {content.processTitle}
          </h2>

          <div className="relative">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-white/[0.08] sm:block" />
            <div className="relative grid grid-cols-2 gap-y-8 sm:grid-cols-4">
              {steps.map((step, i) => {
                const c = STEP_COLORS[i % STEP_COLORS.length];
                return (
                  <div key={step.title} className="flex flex-col items-center text-center">
                    <span
                      style={{ color: c.color }}
                      className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-[#0A0A0A]"
                    >
                      <step.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-[16px] font-bold text-white">{step.title}</h3>
                    <p className="mt-1 max-w-[150px] text-[13.5px] leading-snug text-[#A1A1AA]">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
