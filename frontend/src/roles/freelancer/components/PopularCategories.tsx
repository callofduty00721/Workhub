import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Briefcase, Code2, Palette, Megaphone, Video, PenLine, Music, Users, Brain, Sparkles, Camera, BarChart3 } from "lucide-react";
import { freelancerApi } from "@/api/freelancers";
import { SERVICE_CATEGORY_NAMES } from "@/lib/mockData";

const CATEGORY_ICONS: Record<string, typeof Code2> = {
  "Graphics & Design": Palette,
  "Programming & Tech": Code2,
  "Digital Marketing": Megaphone,
  "Video & Animation": Video,
  "Writing & Translation": PenLine,
  "Music & Audio": Music,
  Business: Briefcase,
  Consulting: Users,
  "AI Services": Brain,
  "Personal Growth": Sparkles,
  Photography: Camera,
  Data: BarChart3,
};

export default function PopularCategories({ onSelect }: { onSelect: (category: string) => void }) {
  const { data: counts } = useQuery({ queryKey: ["freelancers", "category-counts"], queryFn: () => freelancerApi.categoryCounts() });

  return (
    <section className="border-b bg-white">
      <div className="container py-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Popular Categories</h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
        >
          {SERVICE_CATEGORY_NAMES.map((name) => {
            const Icon = CATEGORY_ICONS[name] ?? Briefcase;
            const count = counts?.[name] ?? 0;
            return (
              <motion.button
                key={name}
                type="button"
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                onClick={() => onSelect(name)}
                className="group flex min-w-[168px] shrink-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-primary/40 hover:shadow-[0_8px_20px_-10px_rgba(250,131,46,0.25)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-neutral-900">{name}</span>
                  <span className="text-[10.5px] text-neutral-400">{count.toLocaleString()} freelancers</span>
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
