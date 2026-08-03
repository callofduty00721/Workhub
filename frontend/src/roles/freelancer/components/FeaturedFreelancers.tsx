import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { freelancerApi } from "@/api/freelancers";
import { initialsFromName } from "@/lib/utils";

export default function FeaturedFreelancers() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["freelancers", "featured"],
    queryFn: () => freelancerApi.list({ level: "top_rated", limit: 3 }),
  });

  if (isLoading || !featured?.data.length) return null;

  return (
    <section className="border-b bg-white">
      <div className="container py-8">
        <div className="mb-5">
          <h2 className="font-display text-xl font-bold text-neutral-900">Featured Freelancers</h2>
          <p className="mt-1 text-[13px] text-neutral-500">Top-rated professionals with proven success.</p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featured.data.map((freelancer) => (
            <motion.div key={freelancer._id} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -4 }}>
              <Link
                to={`/freelancers/${freelancer._id}`}
                className="group block overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-primary/25 hover:shadow-[0_20px_40px_-20px_rgba(250,131,46,0.3)]"
              >
                {freelancer.avatar ? (
                  <img src={freelancer.avatar} alt={freelancer.name} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/10 text-3xl font-black text-primary">
                    {initialsFromName(freelancer.name)}
                  </div>
                )}

                <div className="p-4">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14.5px] font-bold text-neutral-900">{freelancer.name}</h3>
                      <p className="truncate text-[12px] text-neutral-500">{freelancer.headline || "Professional Freelancer"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums text-amber-700">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {freelancer.rating ? freelancer.rating.toFixed(1) : "0.0"}
                    </div>
                  </div>

                  {freelancer.skills.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {freelancer.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-full bg-primary/5 px-2 py-0.5 text-[10.5px] font-medium text-primary/90">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative flex h-9 items-center justify-center overflow-hidden rounded-lg bg-neutral-900 text-[12.5px] font-medium text-white transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-secondary">
                    <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-[20deg] bg-white/25 transition-transform duration-700 group-hover:translate-x-[420%]" />
                    View Profile
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
