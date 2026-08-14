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
    <div className="flex w-full max-w-2xl gap-1 rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-1.5 sm:gap-1.5">
      {TABS.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            aria-label={item.title}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium transition-all duration-200 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-[15px]",
              active
                ? "bg-gradient-to-b from-[#E8FF25] to-[#22C55E] text-black"
                : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">{item.shortTitle}</span>
            <span className="hidden sm:inline">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
}
