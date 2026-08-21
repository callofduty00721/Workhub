import { motion } from "framer-motion";
import { Users, Briefcase, FolderKanban, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "freelancers" | "services" | "projects" | "contests";

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

// `shortTitle` is what actually fits at mobile widths — four tabs in one
// row leaves ~90px each on a 390px screen, and "Freelancers" alone doesn't
// fit alongside the other three at any readable size. Everything else is
// already short enough to use as-is.
const TABS = [
  { id: "freelancers", title: "Freelancers", shortTitle: "Talent", icon: Users },
  { id: "services", title: "Services", shortTitle: "Services", icon: Briefcase },
  { id: "projects", title: "Projects", shortTitle: "Projects", icon: FolderKanban },
  { id: "contests", title: "Contests", shortTitle: "Contests", icon: Trophy },
] as const;

export default function MarketplaceTabs({ tab, setTab }: Props) {
  return (
    <div className="flex w-full max-w-xl gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:gap-1">
      {TABS.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            aria-label={item.title}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm",
              active ? "text-black" : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            {active && (
              <motion.span
                layoutId="marketplace-tab-active"
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-[#65A30D] to-[#22C55E] shadow-[0_6px_16px_-6px_rgba(34,197,94,0.55)]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <item.icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
            <span className="relative z-10 sm:hidden">{item.shortTitle}</span>
            <span className="relative z-10 hidden sm:inline">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
}
