import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, BadgeCheck, MapPin, Loader2, Globe, Github, Twitter, type LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { DirectHireModal } from "@/roles/freelancer/components/DirectHireModal";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, cn } from "@/lib/utils";
import { getSkillIcon } from "@/lib/skillIcons";
import type { FreelancerSummary } from "@/types";

// Real links only — these are the same generic socialLinks.{website,github,twitter}
// fields already used on founder/investor/partner/client cards, just not
// shown on the freelancer card until now. No follower counts are shown
// (unlike the influencer card's platforms) because freelancers don't have
// that data — these are plain profile links.
const LINK_META: Record<"website" | "github" | "twitter", { icon: LucideIcon; color: string; label: string }> = {
  website: { icon: Globe, color: "#525252", label: "Website" },
  github: { icon: Github, color: "#171717", label: "GitHub" },
  twitter: { icon: Twitter, color: "#171717", label: "Twitter" },
};

export function FreelancerCard({ freelancer }: { freelancer: FreelancerSummary }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const country = freelancer.location
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .pop();
  const isVerified = freelancer.kycStatus === "verified";
  const isOwnCard = user?.id === freelancer._id;
  const visibleSkills = freelancer.skills.slice(0, 2);
  const extraSkillsCount = freelancer.skills.length - visibleSkills.length;
  const links = (["website", "github", "twitter"] as const)
    .map((key) => ({ key, url: freelancer.socialLinks?.[key], ...LINK_META[key] }))
    .filter((l): l is typeof l & { url: string } => !!l.url);

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
    <>
    <Link to={`/freelancers/${freelancer._id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)]"
      >
        {!isOwnCard && (
          <div onClick={(e) => e.preventDefault()} className="absolute right-5 top-5 z-10">
            <SaveButton type="freelancer" id={freelancer._id} className="h-10 w-10 bg-white/90 text-red-00 hover:bg-white" />
          </div>
        )}

        {/* Avatar — normal flow now that the cover banner is gone. Same
            decorative conic-gradient ring used on the influencer card, kept
            purely as an accent (not tied to any real field). */}
        <div className="flex justify-center pt-6">
          <div
            className="h-[84px] w-[84px] rounded-full p-[3px]"
            style={{ background: "conic-gradient(from 180deg, #F59E0B, #EC4899, #8B5CF6, #3B82F6, #F59E0B)" }}
          >
            <Avatar className="h-full w-full border-[5px] border-white shadow-[0_12px_25px_rgba(0,0,0,0.18)]">
              <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
              <AvatarFallback className="bg-white text-xl font-semibold text-neutral-900">{initialsFromName(freelancer.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-5 pt-3 text-center">
          <div>
            <h2 className="flex items-center justify-center gap-1.5 text-xl font-semibold leading-tight text-neutral-900">
              {freelancer.name}
              {isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-neutral-900" />}
            </h2>
            <p className="mt-1 truncate text-sm font-medium text-neutral-600">{freelancer.headline || "Professional Freelancer"}</p>
            {country && (
              <span className="mt-1.5 flex items-center justify-center gap-2 text-sm text-neutral-800">
                <MapPin className="h-4 w-4" /> {country}
              </span>
            )}

            {visibleSkills.length > 0 && (
              <div className="my-3 flex flex-wrap items-center justify-center gap-2">
                {visibleSkills.map((skill) => {
                  const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
                  return (
                    <span
                      key={skill}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full bg-neutral-100 py-1 pr-3 text-xs font-medium text-neutral-700",
                        brand ? "pl-1.5" : "pl-3"
                      )}
                    >
                      {brand && <SkillIcon className="h-4 w-4 shrink-0" style={{ color }} />}
                      {skill}
                    </span>
                  );
                })}
                {extraSkillsCount > 0 && (
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500">
                    +{extraSkillsCount}
                  </span>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mt-3 grid grid-cols-3 items-center justify-center gap-2 border-t-2 border-b-2 border-neutral-300 py-3 text-center text-sm">
              <div>
                {freelancer.rating > 0 ? (
                  <p className="flex items-center justify-center gap-1 text-base font-semibold text-neutral-900">
                    <Star className="h-[10px] w-[10px] fill-amber-400 text-amber-400" />
                    {freelancer.rating.toFixed(1)}
                  </p>
                ) : (
                  <p className="text-base font-semibold text-neutral-400">New</p>
                )}
              </div>
              <div className="border-x-2 border-neutral-300">
                <p className="text-base font-semibold text-neutral-900">{freelancer.jobsCompleted ? `${freelancer.jobsCompleted}+` : "0"}</p>
                <p className="mt-1 text-xs tracking-wider text-neutral-600">Jobs Done</p>
              </div>
              <div>
                <p className="text-base font-semibold text-neutral-900">
                  {freelancer.hourlyRate > 0 ? `₹${new Intl.NumberFormat("en-IN").format(freelancer.hourlyRate)} /hr` : "—"}
                </p>
                <p className="mt-1 text-xs tracking-wider text-neutral-600">Rate</p>
              </div>
            </div>

            {/* Links — real socialLinks fields (website/GitHub/Twitter),
                same ones already shown on founder/investor/partner/client
                cards. */}
            {links.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {links.map(({ key, url, icon: Icon, color, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => stopAndRun(e, () => window.open(url, "_blank", "noopener,noreferrer"))}
                    style={{ borderColor: color, color }}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-transform hover:scale-105"
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buttons — pinned to the card's bottom edge regardless of how
              much content (skills, headline wrap) sits above it, so every
              card in a row lines up at the same height. */}
          <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
            <button
              type="button"
              disabled={isOwnCard}
              onClick={(e) => stopAndRun(e, () => (user ? setHireModalOpen(true) : navigate("/login")))}
              className="rounded-full bg-[#171717] py-3 text-center text-sm font-medium text-white transition-colors duration-300 hover:bg-[#000000] disabled:opacity-50"
            >
              Hire Now
            </button>
            <button
              type="button"
              disabled={!user || messageMutation.isPending}
              onClick={(e) => stopAndRun(e, () => (user ? messageMutation.mutate() : navigate("/login")))}
              className="flex items-center justify-center gap-1.5 rounded-full border-2 border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-900 transition-colors duration-300 hover:bg-neutral-50 disabled:opacity-50"
            >
              {messageMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Chat
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
    <DirectHireModal
      freelancerId={freelancer._id}
      freelancerName={freelancer.name}
      open={hireModalOpen}
      onOpenChange={setHireModalOpen}
    />
    </>
  );
}
