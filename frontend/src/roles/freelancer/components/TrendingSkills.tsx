import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// A curated set of common skill searches — static suggestions, not a
// computed "trending" ranking (the platform doesn't track that yet).
const POPULAR_SKILLS = ["React", "Node.js", "Flutter", "AI & ML", "MongoDB", "SEO", "Python", "Next.js", "UI Design", "Figma"];

export default function TrendingSkills({ onSelect }: { onSelect: (skill: string) => void }) {
  return (
    <section className="border-b bg-white">
      <div className="container py-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
          <Sparkles className="h-4 w-4 text-primary" /> Popular Skills
        </h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
          className="flex flex-wrap gap-2"
        >
          {POPULAR_SKILLS.map((skill) => (
            <motion.button
              key={skill}
              type="button"
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              onClick={() => onSelect(skill)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              {skill}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
