import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, BadgeCheck, MapPin, Loader2, Globe, Github, Twitter, type LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
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

export function FreelancerCard({
  freelancer,
  variant = "default",
}: {
  freelancer: FreelancerSummary;
  // "dark": for the Freelancers page grid, sitting directly on the page's
  // black background — SearchResults.tsx keeps the default light card.
  variant?: "default" | "dark";
}) {
  const dark = variant === "dark";
  const { user } = useAuth();
  const navigate = useNavigate();
  const country = freelancer.location
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .pop();
  const isVerified = freelancer.kycStatus === "verified";
  const isOwnCard = user?.id === freelancer._id;
  const isAvailable = freelancer.availabilityStatus === "available";
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
    <Link to={`/freelancers/${freelancer._id}`} className="block h-full">
      <motion.div
        whileHover={{ y: dark ? -4 : -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "group relative flex h-full w-full flex-col overflow-hidden rounded-[22px] transition-colors duration-200",
          dark
            ? "border border-white/[0.08] bg-[#0A0A0A] hover:border-[#22C55E]/25 hover:shadow-[0_0_0_1px_rgba(34,197,94,0.08),0_20px_50px_-20px_rgba(34,197,94,0.15)]"
            : "bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] rounded-[28px]"
        )}
      >
        {!isOwnCard && (
          <div onClick={(e) => e.preventDefault()} className="absolute right-4 top-4 z-10">
            <SaveButton
              type="freelancer"
              id={freelancer._id}
              className={dark ? "h-9 w-9 bg-black/60 text-white hover:bg-black/80" : "h-10 w-10 bg-white/90 text-red-00 hover:bg-white"}
            />
          </div>
        )}

        {/* Avatar — normal flow now that the cover banner is gone. Same
            decorative conic-gradient ring used on the influencer card, kept
            purely as an accent (not tied to any real field). Availability dot
            reflects the real availabilityStatus field, not a fabricated
            "online" concept the API doesn't have. */}
        <div className={cn("flex justify-center", dark ? "pt-7" : "pt-8")}>
          <div className="relative">
            <div
              className={cn("rounded-full p-[3px]", dark ? "h-[92px] w-[92px]" : "h-[122px] w-[122px]")}
              style={{ background: "conic-gradient(from 180deg, #F59E0B, #EC4899, #8B5CF6, #3B82F6, #F59E0B)" }}
            >
              <Avatar
                className={cn(
                  "h-full w-full transition-transform duration-200 group-hover:scale-[1.03]",
                  dark ? "border-[4px] border-[#0A0A0A]" : "border-[6px] border-white shadow-[0_12px_25px_rgba(0,0,0,0.18)]"
                )}
              >
                <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                <AvatarFallback className={cn("font-bold", dark ? "bg-neutral-900 text-[32px] text-white" : "bg-white text-[42px] text-neutral-900")}>
                  {initialsFromName(freelancer.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            {freelancer.availabilityStatus && (
              <span
                className={cn(
                  "absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2",
                  dark ? "border-[#0A0A0A]" : "border-white",
                  isAvailable ? "bg-[#22C55E]" : "bg-neutral-400"
                )}
                aria-label={isAvailable ? "Available for projects" : "Busy"}
              />
            )}
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col text-center", dark ? "px-5 pb-5 pt-3" : "px-6 pb-6 pt-4")}>
          <div>
            <h2
              className={cn(
                "flex items-center justify-center gap-1.5 font-semibold leading-tight",
                dark ? "text-[19px] text-white" : "text-[26px] text-neutral-900"
              )}
            >
              {freelancer.name}
              {isVerified && <BadgeCheck className={cn("h-4.5 w-4.5 shrink-0", dark ? "text-[#22C55E]" : "text-neutral-900")} />}
            </h2>
            <p className={cn("mt-1 truncate font-medium", dark ? "text-[14px] text-[#A1A1AA]" : "text-[17px] text-neutral-600")}>
              {freelancer.headline || "Professional Freelancer"}
            </p>

            {dark ? (
              <div className="mt-2.5 flex items-center justify-center gap-3 text-[12.5px]">
                <span className="flex items-center gap-1 font-semibold text-white">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {freelancer.rating > 0 ? freelancer.rating.toFixed(1) : "New"}
                  {freelancer.reviewCount > 0 && <span className="font-normal text-[#71717A]">({freelancer.reviewCount})</span>}
                </span>
                {country && (
                  <span className="flex items-center gap-1 text-[#71717A]">
                    <MapPin className="h-3 w-3" /> {country}
                  </span>
                )}
              </div>
            ) : (
              country && (
                <span className="mt-2 flex items-center justify-center gap-2 text-[16px] text-neutral-800">
                  <MapPin className="h-4 w-4" /> {country}
                </span>
              )
            )}

            {/* Tags — reserves its row even with no skills, so every card in
                a grid row keeps the same stats/button position underneath. */}
            <div className={cn("flex min-h-[38px] flex-wrap items-center justify-center gap-2", dark ? "my-3.5" : "my-4 gap-2.5")}>
              {visibleSkills.length > 0 ? (
                <>
                  {visibleSkills.map((skill) => {
                    const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
                    return (
                      <span
                        key={skill}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full font-semibold",
                          dark ? "bg-white/[0.06] py-1 pr-3 text-[12.5px] text-[#D4D4D8]" : "bg-neutral-100 py-1.5 pr-3.5 text-[14px] text-neutral-700",
                          brand ? "pl-1.5" : dark ? "pl-3" : "pl-3.5"
                        )}
                      >
                        {brand && <SkillIcon className="h-4 w-4 shrink-0" style={{ color }} />}
                        {skill}
                      </span>
                    );
                  })}
                  {extraSkillsCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full border font-semibold",
                        dark
                          ? "border-white/[0.08] bg-transparent px-3 py-1 text-[12.5px] text-[#71717A]"
                          : "border-neutral-200 bg-white px-3.5 py-2 text-[14px] text-neutral-500"
                      )}
                    >
                      +{extraSkillsCount}
                    </span>
                  )}
                </>
              ) : (
                <span className={cn("italic", dark ? "text-[12.5px] text-[#52525B]" : "text-[14px] text-neutral-400")}>No skills listed yet</span>
              )}
            </div>

            {/* Stats */}
            <div
              className={cn(
                "grid grid-cols-3 items-center justify-center gap-2 border-t border-b py-3.5 text-center",
                dark ? "-my-1 border-white/[0.08] text-[12.5px]" : "-my-2 border-t-2 border-b-2 border-neutral-300 py-4 text-[14px]"
              )}
            >
              {!dark && (
                <div>
                  {freelancer.rating > 0 ? (
                    <p className="flex items-center justify-center gap-1 text-[18px] font-semibold text-neutral-900">
                      <Star className="h-[10px] w-[10px] fill-amber-400 text-amber-400" />
                      {freelancer.rating.toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-[18px] font-semibold text-neutral-900">0.0</p>
                  )}
                  <p className="mt-1 text-[14px] tracking-wider text-neutral-600">Rating</p>
                </div>
              )}
              <div className={cn(!dark && "border-x-2 border-neutral-300")}>
                <p className={cn("font-semibold", dark ? "text-[15px] text-white" : "text-[18px] text-neutral-900")}>
                  {freelancer.jobsCompleted ? `${freelancer.jobsCompleted}+` : "0"}
                </p>
                <p className={cn("mt-1 tracking-wider", dark ? "text-[11.5px] text-[#71717A]" : "text-[14px] text-neutral-600")}>Jobs Done</p>
              </div>
              <div className={dark ? "border-l border-white/[0.08]" : undefined}>
                <p className={cn("font-semibold", dark ? "text-[15px] text-white" : "text-[18px] text-neutral-900")}>
                  {freelancer.hourlyRate > 0 ? `₹${new Intl.NumberFormat("en-IN").format(freelancer.hourlyRate)}/hr` : "—"}
                </p>
                <p className={cn("mt-1 tracking-wider", dark ? "text-[11.5px] text-[#71717A]" : "text-[14px] text-neutral-600")}>Rate</p>
              </div>
              {dark && (
                <div className="border-l border-white/[0.08]">
                  <p className={cn("font-semibold text-[15px]", isAvailable ? "text-[#22C55E]" : "text-[#71717A]")}>
                    {freelancer.availabilityStatus ? (isAvailable ? "Free" : "Busy") : "—"}
                  </p>
                  <p className="mt-1 text-[11.5px] tracking-wider text-[#71717A]">Status</p>
                </div>
              )}
            </div>

            {/* Links — real socialLinks fields (website/GitHub/Twitter),
                same ones already shown on founder/investor/partner/client
                cards. Reserves its row even with none set so cards line up. */}
            <div className={cn("mt-4 flex min-h-[34px] flex-wrap items-center justify-center gap-2", dark && "hidden sm:flex")}>
              {links.length > 0 ? (
                links.map(({ key, url, icon: Icon, color, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => stopAndRun(e, () => window.open(url, "_blank", "noopener,noreferrer"))}
                    style={dark ? undefined : { borderColor: color, color }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-transform hover:scale-105",
                      dark && "border-white/[0.08] text-[#A1A1AA]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))
              ) : (
                <span className={cn("italic", dark ? "text-[12px] text-[#52525B]" : "text-[13px] text-neutral-400")}>No links added yet</span>
              )}
            </div>
          </div>

          {/* Buttons — pinned to the card's bottom edge regardless of how
              much content (skills, headline wrap) sits above it, so every
              card in a row lines up at the same height. */}
          <div className={cn("mt-auto grid grid-cols-2 gap-3", dark ? "pt-5" : "gap-3.5 pt-6")}>
            <div
              className={cn(
                "rounded-full text-center font-medium transition-all duration-200",
                dark
                  ? "bg-gradient-to-b from-[#E8FF25] to-[#22C55E] py-3 text-[14px] text-black group-hover:brightness-110"
                  : "bg-[#171717] py-3.5 text-base text-white hover:bg-[#000000]"
              )}
            >
              Hire Now
            </div>
            <button
              type="button"
              disabled={!user || messageMutation.isPending}
              onClick={(e) => stopAndRun(e, () => (user ? messageMutation.mutate() : navigate("/login")))}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-200 disabled:opacity-50",
                dark
                  ? "border border-white/[0.08] bg-white/[0.04] py-3 text-[14px] text-white hover:bg-white/[0.08]"
                  : "border-2 border-neutral-200 bg-white py-3.5 text-base text-neutral-900 hover:bg-neutral-50"
              )}
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
