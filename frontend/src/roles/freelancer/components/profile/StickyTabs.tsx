// roles/freelancer/components/profile/StickyTabs.tsx

import { cn } from "@/lib/utils";

const tabs = [
  { id: "about", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "reviews", label: "Reviews" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
];

export default function StickyTabs() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);

    if (!el) return;

    window.scrollTo({
      top: el.offsetTop - 100,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="
        sticky
        top-16
        z-40
        rounded-2xl
        border
        bg-white/95
        backdrop-blur
        shadow-sm
      "
    >
      <div className="flex overflow-x-auto px-2 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => scrollTo(tab.id)}
            className={cn(
              "rounded-xl px-5 py-3 text-sm font-medium",
              "transition-all duration-200",
              "hover:bg-slate-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}