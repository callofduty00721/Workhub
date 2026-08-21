import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bookmark,
  MapPin,
  BadgeCheck,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { startupApi } from "@/api/startups";
import { useAuth } from "@/context/AuthContext";
import { cn, formatFundingCompact, initialsFromName } from "@/lib/utils";
import type { Startup } from "@/types";

const STAGE_LABELS: Record<Startup["stage"], string> = {
  idea: "Idea Stage",
  pre_seed: "Pre-Seed",
  seed: "Seed Stage",
  series_a: "Series A",
  series_b: "Series B",
  growth: "Growth",
};

export function StartupCard({ startup }: { startup: Startup }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isFollowing = user ? startup.followers.includes(user.id) : false;

  const followMutation = useMutation({
    mutationFn: () => startupApi.toggleFollow(startup._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  const founder = typeof startup.founder === "object" ? startup.founder : null;
  const pct = Math.min(100, Math.round((startup.fundingRaised / (startup.fundingNeeded || 1)) * 100));
  const openRoleCount = startup.openRoles?.length ?? 0;
  const isHiring = openRoleCount > 0;
  const isSeekingInvestment = startup.fundingRaised < startup.fundingNeeded && startup.fundingNeeded > 0;
  const isVerified = startup.isVerified || startup.founderVerified;
  const teamSize = (startup.team?.length ?? 0) + 1;

  // Founder + team avatars, capped so the row stays a row.
  const people = [
    ...(founder ? [{ name: founder.name, avatar: founder.avatar }] : []),
    ...(startup.team ?? []).map((m) => ({ name: m.name, avatar: m.avatar })),
  ];
  const visiblePeople = people.slice(0, 3);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-neutral-300 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.18)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <motion.div
            whileHover={{ rotate: -4, scale: 1.05 }}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-neutral-100"
          >
            {startup.logo ? (
              <img
                src={startup.logo}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-lg font-black text-neutral-900">{initialsFromName(startup.name)}</span>
              </div>
            )}
          </motion.div>

          <div className="min-w-0">
            <Link to={`/startups/${startup._id}`} className="group/name inline-flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-[18px] font-black tracking-tight text-neutral-900">
                {startup.name}
              </h2>
              {isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-neutral-900" />}
            </Link>
            {startup.tagline && <p className="mt-0.5 line-clamp-2 max-w-md text-[16px] text-neutral-500">{startup.tagline}</p>}

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[14px] font-medium text-neutral-600">{STAGE_LABELS[startup.stage]}</span>
              {startup.industry && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[14px] font-medium text-neutral-600">{startup.industry}</span>}
              {startup.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[14px] font-medium text-neutral-600">
                  <MapPin className="h-2.5 w-2.5" /> {startup.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bookmark + verification */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              if (user) followMutation.mutate();
            }}
            disabled={!user || followMutation.isPending}
            aria-label="Follow startup"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors duration-200 hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed"
          >
            <Bookmark className={cn("h-3.5 w-3.5 transition-colors", isFollowing && "fill-neutral-900 text-neutral-900")} />
          </motion.button>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
              isVerified ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-400"
            )}
          >
            {isVerified ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
            {isVerified ? "Verified" : "Unverified"}
          </span>
        </div>
      </div>

      {/* Funding need */}
      {startup.fundingNeeded > 0 && (
        <div className="mt-3 rounded-2xl bg-neutral-100 px-3.5 py-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500">Funding Need</p>
          <p className="mt-1 text-[17px] font-bold leading-tight tabular-nums text-neutral-900">
            {formatFundingCompact(startup.fundingNeeded)} <span className="text-[14px] font-medium text-neutral-400">INR · {pct}% raised</span>
          </p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: pct / 100 }}
              viewport={{ once: true }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-neutral-900"
            />
          </div>
        </div>
      )}

      {startup.description && (
        <p className="mt-3 line-clamp-2 text-[16px] leading-relaxed text-neutral-600">{startup.description}</p>
      )}

      {/* Hiring / investor opportunity cards */}
      {(isHiring || isSeekingInvestment) && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {isHiring && (
            <Link
              to={`/startups/${startup._id}?tab=team`}
              className="group/panel relative flex max-h-[104px] flex-col justify-between overflow-hidden rounded-2xl bg-neutral-100 p-4 transition-colors hover:bg-neutral-200/70"
            >
              <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">Hiring</p>
              <p className="pr-2 text-[14px] font-medium leading-snug text-neutral-900">
                {openRoleCount} Role {openRoleCount === 1 ? "" : "s"} Needed.
              </p>
              <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform duration-200 group-hover/panel:scale-110">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}

          {isSeekingInvestment && (
            <Link
              to={`/startups/${startup._id}?tab=funding`}
              className="group/panel relative flex max-h-[104px] flex-col justify-between overflow-hidden rounded-2xl bg-neutral-100 p-4 transition-colors hover:bg-neutral-200/70"
            >
              <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">Investment</p>
              <p className="pr-2 text-[14px] font-medium leading-snug text-neutral-900">
                {formatFundingCompact(startup.fundingNeeded - startup.fundingRaised)} needed.
              </p>
              <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform duration-200 group-hover/panel:scale-110">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}
        </div>
      )}

      {/* Footer: team + primary CTA, pinned to the card's bottom edge so every
          card in a row lines up regardless of how much content sits above it. */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {visiblePeople.map((p, i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-white shadow transition-transform duration-200 hover:z-10 hover:scale-110">
                <AvatarImage src={p.avatar} alt={p.name} />
                <AvatarFallback className="bg-neutral-800 text-[9px] font-bold text-white">{initialsFromName(p.name)}</AvatarFallback>
              </Avatar>
            ))}
            {people.length > 3 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-800 text-[9px] font-bold text-white shadow">
                +{people.length - 3}
              </div>
            )}
          </div>
          <p className="text-[11px] font-semibold text-neutral-600">{teamSize} member{teamSize === 1 ? "" : "s"}</p>
        </div>

        <Link
          to={`/startups/${startup._id}`}
          className="group/cta relative flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-black px-4 py-2 text-[13px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(250,131,46,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105"
        >
          <span className="pointer-events-none absolute left-[-120%] top-0 h-full w-16 rotate-12 bg-white/30 transition-all duration-700 group-hover/cta:left-[140%]" />
          <span className="relative flex items-center gap-1.5">
            View Startup
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-1" />
          </span>
        </Link>
      </div>
    </motion.div>
  );
}
