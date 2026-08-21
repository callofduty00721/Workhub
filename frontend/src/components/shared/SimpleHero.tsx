import { motion } from "framer-motion";
import { Search, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export interface SimpleHeroTrustPoint {
  icon: LucideIcon;
  label: string;
  color: string;
}

// Same hero shape as PremiumHero (Freelancers hub) / JobList's hero — blob
// background, eyebrow badge, big headline, real trust points, search bar.
// Reused across the smaller directory pages (Influencers/Investors/Mentors/
// Partners) so they read as siblings of the bigger hubs instead of a plain
// title-and-search header.
export function SimpleHero({
  badgeIcon: BadgeIcon,
  badgeText,
  title,
  accent,
  description,
  trustPoints,
  search,
  onSearchChange,
  searchPlaceholder,
}: {
  badgeIcon: LucideIcon;
  badgeText: string;
  title: string;
  accent: string;
  description: string;
  trustPoints: SimpleHeroTrustPoint[];
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}) {
  return (
    <section className="relative overflow-hidden bg-white pb-10 pt-16 sm:pb-12 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-32 top-[-100px] h-[420px] w-[420px] rounded-full bg-[#171717] opacity-20 blur-[100px]"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 top-[80px] h-[360px] w-[360px] rounded-full bg-[#E11D48] opacity-[0.12] blur-[110px]"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div initial="hidden" animate="show" variants={stagger} className="container flex flex-col items-center text-center">
        <motion.span
          variants={fadeUp}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F5] px-4 py-1.5 text-[14px] font-semibold text-gray-700 ring-1 ring-gray-900/5"
        >
          <BadgeIcon className="h-3.5 w-3.5" />
          {badgeText}
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="mt-4 max-w-xl font-display text-4xl font-black-thin leading-[1] tracking-[-0.03em] text-neutral-900 sm:text-5xl"
        >
          {title} <span className="text-[#171717]">{accent}</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-4 max-w-md text-[18px] leading-relaxed text-neutral-500">
          {description}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {trustPoints.map((t) => (
            <span key={t.label} className="flex items-center gap-1.5 text-[15px] font-medium text-neutral-500">
              <t.icon className={`h-4 w-4 ${t.color}`} />
              {t.label}
            </span>
          ))}
        </motion.div>

        <motion.form
          variants={fadeUp}
          onSubmit={(e) => e.preventDefault()}
          className="relative z-10 mt-8 w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-1.5"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 border-0 pl-9 text-[17px] shadow-none focus-visible:ring-0"
            />
          </div>
        </motion.form>
      </motion.div>
    </section>
  );
}
