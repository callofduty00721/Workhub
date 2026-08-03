import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Rocket,
  Users,
  Briefcase,
  Handshake,
  Trophy,
  GraduationCap,
  Check,
  ChevronDown,
  Zap,
  Search,
  UserPlus,
  ListPlus,
  MessageSquareText,
} from "lucide-react";
import { HOME_PRICING_TEASER, FAQS } from "@/lib/mockData";
import { formatCurrency, cn } from "@/lib/utils";
import circleImage from "@/assets/circle.avif";
import { OverlapCardStack } from "@/components/shared/OverlapCardStack";

// Six personas orbiting the hub — position is a hexagon in percentage coordinates
// (0,0 top-left of the visual), derived from angle -90 stepping by 60deg.
const ORBIT_NODES = [
  { icon: Rocket, label: "Startups", to: "/startups", x: 50, y: 10 },
  { icon: Handshake, label: "Investors", to: "/investors", x: 84, y: 30 },
  { icon: GraduationCap, label: "Mentors", to: "/mentors", x: 84, y: 70 },
  { icon: Users, label: "Freelancers", to: "/freelancers", x: 50, y: 90 },
  { icon: Briefcase, label: "Jobs", to: "/jobs", x: 16, y: 70 },
  {
    icon: Trophy,
    label: "Contests",
    to: "/freelancers?tab=contests",
    x: 16,
    y: 30,
  },
];

// Same six personas, spoken to directly - this is the horizontal "role rail" copy.
const ROLE_RAIL = [
  {
    icon: Rocket,
    tag: "Founders",
    line: "You're building something new.",
    desc: "List your startup and get in front of investors and talent who are actually looking.",
    points: [
      "Post your startup profile, stage, and funding needs",
      "Get discovered by investors and freelancers directly",
      "Manage your team, roles, and updates from one dashboard",
    ],
    to: "/startups",
  },
  {
    icon: Handshake,
    tag: "Investors",
    line: "You're backing what's next.",
    desc: "Filter by stage, sector, and traction. Message founders directly, no cold intros.",
    points: [
      "Browse startups filtered by stage, industry, and location",
      "Message founders directly — no cold intros needed",
      "Track the startups you've shown interest in",
    ],
    to: "/investors",
  },
  {
    icon: GraduationCap,
    tag: "Mentors",
    line: "You've done this before.",
    desc: "Share what you know with founders who need it, on a schedule that works for you.",
    points: [
      "Browse founders actively looking for guidance",
      "Connect on a schedule that works for you",
      "Build a public profile that shows your experience",
    ],
    to: "/mentors",
  },
  {
    icon: Users,
    tag: "Freelancers",
    line: "You ship great work.",
    desc: "Pick up projects and gigs from teams that are hiring now, not just browsing.",
    points: [
      "Browse gigs, projects, and contests in one place",
      "Apply directly to teams that are actively hiring",
      "Build a profile with your skills, rate, and past work",
    ],
    to: "/freelancers",
  },
  {
    icon: Briefcase,
    tag: "Employers",
    line: "You're hiring the team.",
    desc: "Post full-time and remote roles to a pool that already lives in the startup world.",
    points: [
      "Post full-time and remote openings for free",
      "Reach a talent pool that's already startup-native",
      "Review and manage applications from one dashboard",
    ],
    to: "/jobs",
  },
  {
    icon: Trophy,
    tag: "Organizers",
    line: "You want the best idea, fast.",
    desc: "Run a design or content contest and pick a winner from real entries in days.",
    points: [
      "Launch a design or content contest in minutes",
      "Set your own prize, brief, and deadline",
      "Review real submitted entries and pick a winner",
    ],
    to: "/freelancers?tab=contests",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your free account",
    desc: "Pick your role — founder, freelancer, investor, mentor, employer, or organizer — and set up your profile in minutes.",
  },
  {
    icon: ListPlus,
    step: "02",
    title: "Post or browse",
    desc: "List your startup, gig, or job — or browse what others have already posted. No noise, just real opportunities.",
  },
  {
    icon: MessageSquareText,
    step: "03",
    title: "Connect directly",
    desc: "Message the other side directly — no cold intros, no middlemen slowing things down.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const wordStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } },
};

const wordUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// CSS-only "ripple" - an expanding radial flash on press, no JS/DOM injection needed.
const rippleClass =
  "relative overflow-hidden after:absolute after:inset-0 after:rounded-[inherit] after:bg-white/30 after:opacity-0 after:scale-0 after:transition-all after:duration-500 after:content-[''] active:after:opacity-100 active:after:scale-150";

export default function Home() {
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div>
      <HeroSection />
      <HowItWorksSection />
      <RoleRailSection />
      <PricingSection />
      <FAQSection />
      <CtaSection />
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[110px]" />
        <div className="absolute right-0 top-10 h-[380px] w-[380px] rounded-full bg-secondary/10 blur-[110px]" />
      </div>

      <div className="container relative grid gap-16 py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
        <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col">
          <motion.div variants={fadeUp}>
            <span className="mb-5 flex w-fit items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-1.5 text-[12.5px] font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" /> One hub, six kinds of people
            </span>
          </motion.div>
          <motion.h1
            variants={wordStagger}
            className="font-display text-[40px] font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-[54px] lg:text-[60px]"
          >
            {"Every side of the".split(" ").map((word, i) => (
              <motion.span key={`l1-${i}`} variants={wordUp} className="inline-block">
                {word}&nbsp;
              </motion.span>
            ))}
            <br className="hidden sm:block" />
            <motion.span
              variants={wordUp}
              className="inline-block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              startup world,
            </motion.span>{" "}
            {"in one place.".split(" ").map((word, i) => (
              <motion.span key={`l2-${i}`} variants={wordUp} className="inline-block">
                {word}&nbsp;
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-lg text-[16px] leading-relaxed text-neutral-500 sm:text-lg"
          >
            Founders, investors, mentors, freelancers, and employers - MahaHub connects all of them in one
            network, instead of six different apps.
          </motion.p>
          <motion.form
            variants={fadeUp}
            onSubmit={handleSearchSubmit}
            className="relative mt-8 max-w-md"
          >
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search startups, freelancers, jobs, gigs..."
              className="h-12 w-full rounded-[12px] border border-neutral-200 bg-white pl-11 pr-24 text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 flex h-9 items-center rounded-[9px] bg-neutral-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-primary"
            >
              Search
            </button>
          </motion.form>

          <motion.div variants={fadeUp} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/startups"
              className={cn(
                rippleClass,
                "flex h-12 items-center justify-center gap-2 rounded-[12px] bg-neutral-900 px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:bg-primary"
              )}
            >
              Explore the hub <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register"
              className={cn(
                rippleClass,
                "flex h-12 items-center justify-center gap-2 rounded-[12px] border border-neutral-200 bg-white px-6 text-[14px] font-semibold text-neutral-800 transition-all hover:-translate-y-0.5 hover:border-neutral-300 after:bg-primary/10"
              )}
            >
              Join free
            </Link>
          </motion.div>
        </motion.div>

        <OrbitHub />
      </div>
    </section>
  );
}

// The signature element: a literal "hub" - a center node connected to six role
// satellites, with a pulse that travels outward along each spoke on a loop.
function OrbitHub() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative mx-auto aspect-square w-full max-w-[380px]"
    >
      {/* Ambient glow behind the whole hub */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-[45px]"
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="spokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.25"
          strokeWidth="0.6"
          strokeDasharray="1.5 3"
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeOpacity="0.12"
          strokeWidth="0.4"
          strokeDasharray="0.8 4"
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        />
        {ORBIT_NODES.map((node, i) => (
          <motion.line
            key={`line-${node.label}`}
            x1="50"
            y1="50"
            x2={node.x}
            y2={node.y}
            stroke="url(#spokeGradient)"
            strokeWidth="0.6"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.35, pathLength: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.3 + i * 0.08,
              ease: "easeOut",
            }}
          />
        ))}
        {ORBIT_NODES.map((node, i) => (
          <motion.circle
            key={`pulse-${node.label}`}
            r="1.8"
            fill="hsl(var(--primary))"
            initial={{ cx: 50, cy: 50, opacity: 0 }}
            animate={{ cx: [50, node.x], cy: [50, node.y], opacity: [0, 1, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              repeatDelay: 3.6,
              delay: i * 0.35,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Center node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="relative flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_20px_44px_-16px_rgba(15,23,42,0.5)]"
        >
          <Zap className="h-5 w-5 text-primary" />
          <span className="mt-0.5 font-display text-[10px] font-bold tracking-tight">MahaHub</span>
        </motion.div>
      </div>

      {/* Satellite nodes */}
      {ORBIT_NODES.map((node, i) => (
        <motion.div
          key={node.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
          transition={{
            opacity: { duration: 0.4, delay: 0.4 + i * 0.08 },
            scale: { duration: 0.4, delay: 0.4 + i * 0.08, ease: "backOut" },
            y: {
              duration: 3.2 + i * 0.25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1 + i * 0.2,
            },
          }}
        >
          <Link
            to={node.to}
            className="group flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_14px_28px_-14px_rgba(250,131,46,0.35)]"
          >
            <node.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="whitespace-nowrap text-[11px] font-semibold text-neutral-700">
              {node.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

function HowItWorksSection() {
  return (
    <section className="border-t border-neutral-100 bg-neutral-50/60 py-10 sm:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[36px]">
            How MahaHub works
          </h2>
          <p className="mt-2 text-[15px] text-neutral-500">Three steps, whichever side of the table you're on.</p>
        </div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-6 sm:grid-cols-3"
        >
          {HOW_IT_WORKS_STEPS.map((item) => (
            <motion.div key={item.step} variants={fadeUp} className="relative rounded-[22px] border border-neutral-200 bg-white p-6">
              <span className="font-display text-[13px] font-bold text-primary/40">{item.step}</span>
              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-[16px] font-bold text-neutral-900">{item.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-500">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function RoleRailSection() {
  return (
    <section className="relative isolate border-t border-neutral-100 bg-white py-10 sm:py-16">
      {/* `overflow-hidden` is scoped to this wrapper alone, not the whole section —
          any `overflow` other than visible on an ancestor of the sticky cards below
          breaks `position: sticky`, so it must not wrap them. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.img
          src={circleImage}
          alt=""
          className="absolute right-[-4%] top-[80px] hidden h-[440px] w-[500px] rotate-[-6deg] object-contain opacity-45 blur-[30px] mix-blend-multiply lg:block"
          initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
          whileInView={{ opacity: 0.45, scale: 1, rotate: -6 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="container relative mb-10 max-w-3xl">
        <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[36px]">
          Wherever you fit in, MahaHub knows it.
        </h2>
        <p className="mt-2 text-[15px] text-neutral-500">Six roles, one network.</p>
      </div>
      <div className="container relative">
        <OverlapCardStack
          items={ROLE_RAIL.map((role) => ({
            icon: role.icon,
            tag: role.tag,
            title: role.line,
            description: role.desc,
            points: role.points,
            href: role.to,
          }))}
        />
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="container py-10 sm:py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[36px]">
          Simple, transparent pricing
        </h2>
        <p className="mt-2 text-[15px] text-neutral-500">
          Start free. Upgrade only when you're ready to grow faster.
        </p>
      </div>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {HOME_PRICING_TEASER.map((plan) => {
          const isPopular = plan.id === "pro";
          return (
            <motion.div
              key={plan.id}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[22px] border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-300",
                isPopular
                  ? "border-primary/30 shadow-[0_20px_44px_-20px_rgba(255,87,34,0.35)]"
                  : "border-neutral-200 hover:border-primary/25 hover:shadow-[0_16px_32px_-16px_rgba(255,87,34,0.2)]"
              )}
            >
              {/* <span
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary to-secondary"
                style={{ opacity: 0.25 + (i / Math.max(PLANS.length - 1, 1)) * 0.75 }}
              /> */}
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary to-secondary px-3 py-1 text-[10px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(255,87,34,0.7)]">
                  Most Popular
                </span>
              )}
              <h3 className="mt-1 text-[14px] font-bold text-neutral-900">{plan.name}</h3>
              <p className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[24px] font-extrabold tabular-nums tracking-tight text-neutral-900">
                  {formatCurrency(plan.priceInInr)}
                </span>
                {plan.priceInInr > 0 && <span className="text-[11px] text-neutral-400">/month</span>}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.slice(0, 3).map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-1.5 text-[11.5px] text-neutral-600"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </motion.div>
      <div className="mt-8 text-center">
        <Link
          to="/pricing"
          className={cn(
            rippleClass,
            "inline-flex h-11 items-center justify-center gap-1.5 rounded-[14px] bg-neutral-900 px-6 text-[13.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary"
          )}
        >
          Compare all plans <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-neutral-100 bg-white py-10 sm:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[36px]">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-[15px] text-neutral-500">
            Everything you need to know about using MahaHub.
          </p>
        </div>
        <div className="mx-auto max-w-2xl space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[13.5px] font-semibold text-neutral-900">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-300",
                      isOpen && "rotate-180 text-primary"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-[12.5px] leading-relaxed text-neutral-500">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="container py-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-neutral-900 via-primary/90 to-secondary px-8 py-12 sm:px-12"
      >
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm sm:flex">
              <Rocket className="h-7 w-7" />
            </span>
            <div>
              <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                <Zap className="h-3 w-3" /> A brand-new platform — be among the first
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                Ready to take your startup to the next level?
              </h2>
              <p className="mt-1 max-w-xl text-sm text-white/75">
                Join MahaHub today and connect with the right people, resources, and opportunities to
                grow faster.
              </p>
            </div>
          </div>
          <Link
            to="/register"
            className={cn(
              rippleClass,
              "flex h-12 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-white px-6 text-[14px] font-semibold text-neutral-900 shadow-[0_12px_28px_-10px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 after:bg-primary/20"
            )}
          >
            Join MahaHub Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
