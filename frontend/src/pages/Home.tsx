import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Rocket,
  Users,
  Briefcase,
  Handshake,
  Trophy,
  GraduationCap,
  Fingerprint,
  Radio,
  Shuffle,
  Plus,
  ShieldCheck,
  Lock,
  UsersRound,
  Megaphone,
} from "lucide-react";
import { FAQS } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const ROLES = [
  { icon: Rocket, tag: "Founders", desc: "Get in front of investors and talent who are actually looking.", to: "/startups", color: "#171717", tint: "#F5F5F5" },
  { icon: Handshake, tag: "Investors", desc: "Filter by stage and sector, then message founders yourself.", to: "/investors", color: "#10B981", tint: "#ECFDF5" },
  { icon: GraduationCap, tag: "Mentors", desc: "Connect with founders who actually want your guidance.", to: "/mentors", color: "#D97706", tint: "#FEF3C7" },
  { icon: Users, tag: "Freelancers", desc: "Browse gigs, projects, and contests from teams hiring now.", to: "/freelancers", color: "#E11D48", tint: "#FFE4E6" },
  { icon: Briefcase, tag: "Employers", desc: "Post full-time and remote roles to a startup-native pool.", to: "/jobs", color: "#0284C7", tint: "#E0F2FE" },
  { icon: Trophy, tag: "Organizers", desc: "Set a brief and prize, pick a winner from real entries.", to: "/freelancers?tab=contests", color: "#9333EA", tint: "#F3E8FF" },
  { icon: Megaphone, tag: "Influencers", desc: "Get discovered by brands looking to collaborate on a real campaign.", to: "/influencers", color: "#0D9488", tint: "#F0FDFA" },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Verified Profiles", color: "text-green-500" },
  { icon: Lock, label: "Secure Platform", color: "text-blue-500" },
  { icon: UsersRound, label: "Real Opportunities", color: "text-purple-500" },
];

const FEATURES = [
  { icon: Fingerprint, title: "Verified, not guessed", desc: "Every profile that matters gets a real review before it goes live." },
  { icon: Radio, title: "Direct signal, no noise", desc: "Message straight through — no recruiter, no bidding war, no middleman." },
  { icon: Shuffle, title: "Switch roles freely", desc: "Founder today, freelancer tomorrow, mentor next week — one profile." },
];

const STEPS = [
  { n: "01", title: "Pick your role", desc: "Founder, freelancer, mentor, investor, or influencer — set up your profile in minutes." },
  { n: "02", title: "Post or browse", desc: "List your startup, gig, or job — or browse what's already there." },
  { n: "03", title: "Connect directly", desc: "Message the other side yourself, no cold intros, no middlemen." },
];

const orbit = (i: number, total: number, radius: number) => {
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

export default function Home() {
  return (
    <div className="overflow-x-clip bg-[linear-gradient(to_bottom,#000000_0%,#052e16_18%,#000000_38%,#04220f_58%,#000000_78%,#052e16_100%)]">
      <HeroSection />
      <OrbitSection />
      <StepsSection />
      <FeatureSection />
      <PricingTeaser />
      <FAQSection />
      <FinalCta />
    </div>
  );
}

// ============================================================
// HERO — black backdrop with a neon green glow blooming from the bottom
// edge, GrowHive wordmark as the centerpiece, staggered motion entrance.
// ============================================================
function HeroSection() {
  return (
  
    <section className="relative flex min-h-screen flex-col justify-center -mt-14  overflow-hidden py-14 sm:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* bottom-anchored glow */}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_70%_65%_at_50%_115%,rgba(34,197,94,0.55),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-[radial-gradient(ellipse_50%_100%_at_50%_130%,rgba(232,255,37,0.35),transparent_70%)]" />
        <motion.div
          className="absolute -right-24 top-[60px] h-[320px] w-[320px] rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] opacity-[0.15] blur-[120px]"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="container flex flex-col items-center text-center"
      >
        <motion.span
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="inline-flex items-center mt-7 gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-[12.5px] font-semibold text-white/80 ring-1 ring-white/10 sm:text-[13px] sm:leading-5"
        >
          Built for seven kinds of people
        </motion.span>

        <motion.h2
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="mt-7 font-display text-6xl font-black tracking-[-0.04em] sm:text-7xl md:text-8xl"
        >
          <span className="text-white">Grow</span>
          <span className="bg-gradient-to-b from-[#E8FF25] to-[#22C55E] bg-clip-text text-transparent">Hive</span>
        </motion.h2>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="mt-6 max-w-2xl font-display text-4xl font-black leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl"
        >
          Build. Hire. <span className="bg-gradient-to-b from-[#E8FF25] to-[#22C55E] bg-clip-text text-transparent">Grow.</span> All in One Place.
        </motion.h1>

        <motion.p variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="mt-5 max-w-lg text-[20px] leading-relaxed text-white/60">
          Founders, investors, mentors, freelancers, employers, organizers, and influencers — connect directly, with no middlemen in between.
        </motion.p>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] px-7 py-3.5 text-[15px] font-semibold text-black transition-all hover:brightness-110"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/startups"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/5"
          >
            Explore the network
          </Link>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {TRUST_BADGES.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5 text-[14px] font-medium text-white/50">
              <b.icon className={`h-4 w-4 ${b.color}`} /> {b.label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================
// STEPS — three-step "how it works" strip: the actual flow, plainly
// stated, right after the hero.
// ============================================================

// ============================================================
// FEATURES — three cards, fresh icons, solid icon chips, motion
// on scroll + hover lift.
// ============================================================
function FeatureSection() {
  return (
    <section className="border-t border-white/10 py-16 sm:py-20">
      <div className="container grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-[#E8FF25] to-[#22C55E] text-black">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-[16px] font-bold text-white">{f.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// ORBIT — six role nodes animated in a slow orbit around a center
// hub; click one to reveal its panel. Fresh motion-driven centerpiece.
// ============================================================
// Radius has to be a real JS number (node position is computed as
// `calc(50% + Xpx)`, not pure CSS) so it can't just be a Tailwind
// breakpoint class — this mirrors the container's own responsive size
// below in JS instead. Without it, mobile got the same 220px radius as
// desktop, which is wider than the phone screen itself and clipped half
// the nodes off-screen instead of shrinking to fit.
function useOrbitRadius() {
  const [radius, setRadius] = useState(90);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setRadius(w < 480 ? 90 : w < 1024 ? 150 : 220);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return radius;
}

function OrbitSection() {
  const [active, setActive] = useState(0);
  const role = ROLES[active];
  const radius = useOrbitRadius();

  // Auto-advance every 4s so the panel doesn't sit static — a manual
  // click below still jumps straight to that role's panel.
  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % ROLES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,197,94,0.18),transparent_70%)]" />

      <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative mx-auto h-[240px] w-[240px] sm:h-[380px] sm:w-[380px] lg:h-[520px] lg:w-[480px]">
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {ROLES.map((r, i) => {
              const { x, y } = orbit(i, ROLES.length, radius);
              return (
                <motion.button
                  key={r.tag}
                  onClick={() => setActive(i)}
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                >
                  <span
                    style={{ backgroundColor: active === i ? r.color : "rgba(255,255,255,0.08)", color: active === i ? "#fff" : r.color }}
                    className="flex h-10 w-10 items-center justify-center rounded-full shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-colors sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                  >
                    <r.icon className="h-4.5 w-4.5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] sm:h-20 sm:w-20 lg:h-24 lg:w-24">
            <span className="text-[11px] font-bold text-black sm:text-[13px] lg:text-[14px]">Hub</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={role.tag}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <span style={{ color: role.color }} className="text-[13px] font-semibold uppercase tracking-[0.12em]">
              {role.tag}
            </span>
            <h3 className="mt-2 text-[26px] font-bold leading-tight text-white sm:text-[30px]">{role.desc}</h3>
            <Link
              to={role.to}
              style={{ backgroundColor: role.color }}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Explore {role.tag} <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ============================================================
// STEPS — three-step "how it works" strip: the actual flow, plainly
// stated, right after the orbit.
// ============================================================
function StepsSection() {
  return (
    <section className="border-t border-white/10 py-16 sm:py-20">
      <div className="container">
        <h2 className="mb-10 text-center font-display text-[26px] font-black tracking-tight text-white sm:text-[30px]">
          Three steps, that's the whole thing.
        </h2>
        <div className="grid gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center sm:text-left"
            >
              <span className="bg-gradient-to-b from-[#E8FF25] to-[#22C55E] bg-clip-text text-[13px] font-bold text-transparent">{s.n}</span>
              <h3 className="mt-2 text-[16px] font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/50">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PRICING TEASER — honest, no fabricated numbers: every role starts
// free, real plans live on /pricing.
// ============================================================
function PricingTeaser() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="font-display text-[22px] font-black tracking-tight text-white sm:text-[26px]">Every role starts free.</h2>
          <p className="mt-2 max-w-md text-[14px] text-white/60">
            Paid plans add things like priority visibility and advanced analytics — see what's included for your role.
          </p>
        </div>
        <Link
          to="/pricing"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] px-6 py-3 text-[14.5px] font-semibold text-black transition-all hover:brightness-110"
        >
          See plans <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-white/10 py-16 sm:py-20">
      <div className="container max-w-4xl">
        <h2 className="mb-8 text-center font-display text-3xl font-black tracking-tight text-white">Frequently asked questions</h2>
        <div className="border-t border-white/10">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.question} className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-xl font-semibold text-white">{faq.question}</span>
                  <Plus className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", isOpen && "rotate-45")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-[18px] leading-relaxed text-white/60">{faq.answer}</p>
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

// ============================================================
// FINAL CTA — flat dark panel with an animated glow blob.
// ============================================================
function FinalCta() {
  return (
    <section
      className="relative overflow-hidden py-20 text-center sm:py-28"
    >
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22C55E]/20 blur-[120px]"
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container">
        <h2 className="mx-auto max-w-lg font-display text-[30px] font-black leading-tight tracking-tight text-white sm:text-[38px]">
          The other side of your next deal is already here.
        </h2>
        <Link
          to="/register"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] px-7 py-3.5 text-[15px] font-semibold text-black transition-all hover:brightness-110"
        >
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
