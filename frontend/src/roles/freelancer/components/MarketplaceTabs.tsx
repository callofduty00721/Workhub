import { Users, Briefcase, FolderKanban, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "freelancers" | "services" | "projects" | "contests";

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

const TABS = [
  { id: "freelancers", title: "Freelancers", icon: Users },
  { id: "services", title: "Services", icon: Briefcase },
  { id: "projects", title: "Projects", icon: FolderKanban },
  { id: "contests", title: "Contests", icon: Trophy },
] as const;

export default function MarketplaceTabs({ tab, setTab }: Props) {
  return (
    <div className="flex w-full max-w-2xl gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-1.5 scrollbar-hide sm:gap-1.5">
      {TABS.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all sm:flex-1 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm",
              active ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md" : "text-neutral-500 hover:bg-white hover:text-neutral-900"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.title}
          </button>
        );
      })}
    </div>
  );
}
