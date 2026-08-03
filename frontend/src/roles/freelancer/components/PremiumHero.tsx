import { motion } from "framer-motion";
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

// Real platform capabilities — no fabricated numbers.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified profiles" },
  { icon: MessageSquare, label: "Direct messaging" },
  { icon: Tag, label: "Transparent rates" },
];

// Copy + icon per tab — kept honest: a count only renders where the caller
// actually has a real number for that tab (freelancers, contests). Services
// and projects don't have a list-level total wired up yet, so their badge
// just names the section instead of guessing a number.
const TAB_CONTENT: Record<
  SectionTab,
  { icon: typeof Users; word: string; accent: string; description: string; searchPlaceholder: string; noun: string }
> = {
  freelancers: {
    icon: Users,
    word: "Hire the best",
    accent: "freelancers",
    description: "Verified professionals, ready to start on your project today. Message directly, no bidding wars.",
    searchPlaceholder: "Search freelancers, skills...",
    noun: "freelancer",
  },
  services: {
    icon: Briefcase,
    word: "Find the right",
    accent: "service",
    description: "Ready-made gigs from freelancers who've already priced out the work — pick one and get started.",
    searchPlaceholder: "Search services...",
    noun: "service",
  },
  projects: {
    icon: FolderKanban,
    word: "Discover open",
    accent: "projects",
    description: "Real project briefs posted by founders and teams looking for someone to build with them.",
    searchPlaceholder: "Search projects...",
    noun: "project",
  },
  contests: {
    icon: Trophy,
    word: "Join exciting",
    accent: "contests",
    description: "Compete on design and content briefs with real prizes, and get picked from real entries.",
    searchPlaceholder: "Search contests...",
    noun: "contest",
  },
};

// Each tab's real lifecycle — matches actual model fields, not a made-up flow:
// services -> order (orderStatus/deliverables/deliveredAt), projects ->
// application (ApplicationStatus: applied/shortlisted/interview/hired),
// contests -> entry (ContestEntry.isWinner).
const HIRE_PROCESS = [
  { icon: Users, title: "Browse verified profiles", desc: "Real skills, real portfolios, real rates" },
  { icon: MessageSquare, title: "Message or hire directly", desc: "No bidding wars — reach out or send a direct hire request" },
  { icon: CalendarCheck, title: "Agree on scope & rate", desc: "Discuss the work and timeline before it begins" },
  { icon: CheckCircle2, title: "Work gets delivered", desc: "Track progress until you approve and complete it" },
];

const SERVICE_PROCESS = [
  { icon: Search, title: "Browse services", desc: "Find a ready-made gig that fits your budget" },
  { icon: ShoppingBag, title: "Choose a package & order", desc: "Pick a package and message the seller to confirm" },
  { icon: PackageCheck, title: "Get it delivered", desc: "The freelancer delivers the work by the agreed date" },
  { icon: CheckCircle2, title: "Review & release payment", desc: "Approve the delivery, or request a revision" },
];

const PROJECT_PROCESS = [
  { icon: FolderKanban, title: "Browse the brief", desc: "Real project scope, budget, and timeline" },
  { icon: Send, title: "Apply with your rate", desc: "Submit a proposal and expected delivery time" },
  { icon: CalendarCheck, title: "Get shortlisted & interviewed", desc: "The client reviews and reaches out" },
  { icon: CheckCircle2, title: "Get hired & start", desc: "Move from applicant to hired for the project" },
];

const CONTEST_PROCESS = [
  { icon: Trophy, title: "Browse the brief", desc: "Real prize, deadline, and requirements" },
  { icon: Upload, title: "Submit your entry", desc: "Upload your work before the deadline" },
  { icon: Eye, title: "Client reviews entries", desc: "Every real submission gets seen" },
  { icon: Award, title: "Winner gets the prize", desc: "Picked from real entries, not a vote count" },
];

// Animated 4-step timeline, reused across every tab's real lifecycle — a
// dot travels the connecting line on a loop while each step gently pulses
// in turn, so the flow reads as a sequence rather than a static list.
function ProcessPanel({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: { icon: LucideIcon; title: string; desc: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative hidden lg:block"
    >
      <div className="relative h-[460px] overflow-hidden rounded-[40px] bg-gradient-to-br from-primary/10 via-white to-secondary/10 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.18)]">
        <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-secondary/20 blur-[120px]" />

        <div className="absolute inset-8 rounded-[28px] bg-white/90 p-7 shadow-2xl backdrop-blur-xl">
          <p className="text-lg font-bold text-neutral-900">{title}</p>
          <p className="mt-1 text-[13px] text-neutral-500">{subtitle}</p>

          <div className="relative mt-6">
            <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary/15 via-primary/30 to-secondary/15" />
            <motion.div
              className="absolute left-[14px] h-3 w-3 rounded-full bg-gradient-to-br from-primary to-secondary shadow-[0_0_0_4px_rgba(250,131,46,0.15)]"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            />

            <div className="flex flex-col gap-5">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="relative flex items-start gap-3.5"
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: i * 1.1 }}
                >
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-primary shadow-sm">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <p className="text-[13px] font-bold text-neutral-900">{step.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-500">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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
  totalCount,
}: PremiumHeroProps) {
  const isFreelancers = tab === "freelancers";
  const isServices = tab === "services";
  const isProjects = tab === "projects";
  const isContests = tab === "contests";
  const hasSidePanel = true;
  const content = TAB_CONTENT[tab];

  const badgeText =
    totalCount !== undefined
      ? totalCount > 0
        ? `${totalCount.toLocaleString()} ${content.noun}${totalCount === 1 ? "" : "s"} available`
        : `Be the first ${content.noun} to join`
      : `Browse ${content.accent}`;

  return (
    <section className="relative overflow-hidden bg-[#FCFCFD]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute right-0 top-0 h-[380px] w-[380px] rounded-full bg-secondary/10 blur-[150px]" />
      </div>

      <div className="container relative pt-14 pb-8 lg:pt-20 lg:pb-10">
        <div className="mx-auto max-w-7xl">
          <div className={hasSidePanel ? "grid items-center gap-14 lg:grid-cols-2" : "mx-auto max-w-2xl text-center"}>
            {/* Left / centered */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.span
                variants={fadeUp}
                className={
                  "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.2em] text-primary" +
                  (hasSidePanel ? "" : " mx-auto")
                }
              >
                <content.icon className="h-3.5 w-3.5" />
                {badgeText}
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className={
                  "mt-6 font-display font-black leading-[1.05] tracking-tight text-neutral-900 " +
                  (hasSidePanel ? "text-[42px] sm:text-[52px]" : "text-[34px] sm:text-[44px]")
                }
              >
                {content.word}{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{content.accent}</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className={"mt-5 text-[15.5px] leading-7 text-neutral-500 " + (hasSidePanel ? "max-w-lg" : "mx-auto max-w-xl")}
              >
                {content.description}
              </motion.p>

              {isFreelancers && (
                <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {TRUST_POINTS.map((t) => (
                    <div key={t.label} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-600">
                      <t.icon className="h-3.5 w-3.5 text-primary" />
                      {t.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Right — animated real lifecycle, one per tab */}
            {isFreelancers && <ProcessPanel title="How hiring works" subtitle="From browsing to a real hire." steps={HIRE_PROCESS} />}
            {isServices && <ProcessPanel title="How ordering a service works" subtitle="The same real steps, every time." steps={SERVICE_PROCESS} />}
            {isProjects && (
              <ProcessPanel title="How getting hired works" subtitle="From application to a real contract." steps={PROJECT_PROCESS} />
            )}
            {isContests && (
              <ProcessPanel title="How winning a contest works" subtitle="Real entries, reviewed and picked." steps={CONTEST_PROCESS} />
            )}
          </div>

          {/* Search bar — full featured on Freelancers, simple search elsewhere
              since category/location/budget only wire up to the freelancer query */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
            onSubmit={handleSearch}
            className={
              "relative z-10 mt-10 rounded-2xl border border-neutral-200 bg-white/90 p-1.5 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl " +
              (hasSidePanel ? "lg:mt-8" : "mx-auto max-w-2xl")
            }
          >
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <div className="relative flex-[1.4]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={content.searchPlaceholder}
                  className="h-10 border-0 pl-9 text-[13px] shadow-none focus-visible:ring-0"
                />
              </div>

              {isFreelancers && (
                <>
                  <div className="hidden h-6 w-px bg-neutral-200 sm:block" />
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location"
                      className="h-10 border-0 pl-9 text-[13px] shadow-none focus-visible:ring-0"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-[13px] font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Search
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
