import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, BadgeCheck, MapPin, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, cn } from "@/lib/utils";
import { getSkillIcon } from "@/lib/skillIcons";
import type { FreelancerSummary } from "@/types";

export function FreelancerCard({ freelancer }: { freelancer: FreelancerSummary }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const country = freelancer.location
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .pop();
  const isVerified = freelancer.kycStatus === "verified";
  const isOwnCard = user?.id === freelancer._id;
  const visibleSkills = freelancer.skills.slice(0, 2);
  const extraSkillsCount = freelancer.skills.length - visibleSkills.length;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(freelancer._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  const stopAndRun = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <Link to={`/freelancers/${freelancer._id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)]"
      >
        {!isOwnCard && (
          <div onClick={(e) => e.preventDefault()} className="absolute right-3.5 top-3.5 z-10">
            <SaveButton type="freelancer" id={freelancer._id} className="h-7 w-7 bg-white/90 text-neutral-500 hover:bg-white" />
          </div>
        )}

        {/* Cover */}
        <div className="relative h-[140px] shrink-0 overflow-hidden bg-gradient-to-br from-primary to-secondary">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle at top right, rgba(255,255,255,.25), transparent 50%)" }}
          />
        </div>

        {/* Avatar — overlaps cover, centered */}
        <div className="absolute left-1/2 top-[85px] -translate-x-1/2">
          <Avatar className="h-[110px] w-[110px] border-[6px] border-white shadow-[0_12px_25px_rgba(0,0,0,0.18)]">
            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
            <AvatarFallback className="bg-white text-[42px] font-bold text-primary">{initialsFromName(freelancer.name)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-[70px] text-center">
          <div>
            <h2 className="flex items-center justify-center gap-1.5 text-[26px] font-semibold leading-tight text-neutral-900">
              {freelancer.name}
              {isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />}
            </h2>
            <p className="mt-1 truncate text-[17px] font-medium text-primary">{freelancer.headline || "Professional Freelancer"}</p>
            {country && (
              <span className="mt-2 flex items-center justify-center gap-2 text-[16px] text-neutral-800">
                <MapPin className="h-4 w-4" /> {country}
              </span>
            )}

            {/* Tags — reserves its row even with no skills, so every card in
                a grid row keeps the same stats/button position underneath. */}
            <div className="my-4 flex min-h-[38px] flex-wrap items-center justify-center gap-2.5">
              {visibleSkills.length > 0 ? (
                <>
                  {visibleSkills.map((skill) => {
                    const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
                    return (
                      <span
                        key={skill}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full bg-neutral-100 py-1.5 pr-3.5 text-[14px] font-semibold text-neutral-700",
                          brand ? "pl-1.5" : "pl-3.5"
                        )}
                      >
                        {brand && <SkillIcon className="h-5 w-5 shrink-0" style={{ color }} />}
                        {skill}
                      </span>
                    );
                  })}
                  {extraSkillsCount > 0 && (
                    <span className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[14px] font-semibold text-neutral-500">
                      +{extraSkillsCount}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[14px] italic text-neutral-400">No skills listed yet</span>
              )}
            </div>

            {/* Stats */}
            <div className="-my-2 grid grid-cols-3 items-center justify-center gap-2 border-t-2 border-b-2 border-neutral-300 py-4 text-center text-[14px]">
              <div>
                {freelancer.rating > 0 ? (
                  <p className="flex items-center justify-center gap-1 text-[22px] font-bold text-neutral-900">
                    <Star className="h-[18px] w-[18px] fill-amber-400 text-amber-400" />
                    {freelancer.rating.toFixed(1)}
                  </p>
                ) : (
                  <p className="text-[18px] font-semibold text-neutral-900">0.0</p>
                )}
                <p className="mt-1 text-[14px] tracking-wider text-neutral-600">Rating</p>
              </div>
              <div className="border-x-2 border-neutral-300">
                <p className="text-[18px]  font-semibold text-neutral-900">{freelancer.jobsCompleted ? `${freelancer.jobsCompleted}+` : "0"}</p>
                <p className="mt-1 text-[14px] tracking-wider text-neutral-600">Jobs Done</p>
              </div>
              <div>
                <p className="text-[18px]  font-semibold text-neutral-900">
                  {freelancer.hourlyRate > 0 ? `₹${new Intl.NumberFormat("en-IN").format(freelancer.hourlyRate)}/hr` : "—"}
                </p>
                <p className="mt-1 text-[14px] tracking-wider text-neutral-600">Rate</p>
              </div>
            </div>
          </div>

          {/* Buttons — pinned to the card's bottom edge regardless of how
              much content (skills, headline wrap) sits above it, so every
              card in a row lines up at the same height. */}
          <div className="mt-auto grid grid-cols-2 gap-3.5 pt-6">
            <div className="rounded-full bg-gradient-to-r from-primary to-secondary py-3.5 text-center text-base font-medium text-white transition-[filter] duration-300 hover:brightness-110">
              Hire Now
            </div>
            <button
              type="button"
              disabled={!user || messageMutation.isPending}
              onClick={(e) => stopAndRun(e, () => (user ? messageMutation.mutate() : navigate("/login")))}
              className="flex items-center justify-center gap-1.5 rounded-full border-2 border-neutral-200 bg-white py-3.5 text-base font-medium text-primary transition-colors duration-300 hover:bg-primary/5 disabled:opacity-50"
            >
              {messageMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Chat
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
