import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Crown, BadgeCheck, MapPin, Clock, RotateCcw, ShieldCheck, Briefcase, ThumbsUp, MessageSquare, ArrowRight, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { formatCurrency, initialsFromName, cn } from "@/lib/utils";
import { getTechIcon } from "@/lib/techIcons";
import type { Service } from "@/types";

const LEVEL_LABEL: Record<string, string> = {
  top_rated: "Top Rated Seller",
  level_1: "Level 1 Seller",
  new: "New Seller",
};

export function GigListCard({ service }: { service: Service }) {
  const [activeImage, setActiveImage] = useState(0);
  const freelancer = typeof service.freelancer === "object" ? service.freelancer : null;
  const images = service.images ?? [];
  const cheapestPackage = service.packages?.length ? service.packages.reduce((min, p) => (p.price < min.price ? p : min)) : null;
  const displayPrice = cheapestPackage?.price ?? service.price;
  const displayDeliveryDays = cheapestPackage?.deliveryDays ?? service.deliveryDays;
  const displayRevisions = cheapestPackage?.revisions ?? service.revisions;
  const visibleSkills = service.skills.slice(0, 5);
  const extraSkillCount = service.skills.length - visibleSkills.length;

  return (
    <Link to={`/services/${service._id}`} className="block">
      <div className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(250,131,46,0.25)] sm:p-5">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,340px)_1fr]">
          {/* Image column — main image plus a thumbnail strip underneath, so
              the column doesn't leave dead space below a fixed-aspect image
              while the content column (variable height) runs longer. */}
          <div className="flex w-full shrink-0 flex-col gap-2.5">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100">
              {images.length > 0 ? (
                <img src={images[activeImage]} alt={service.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5">
                  <span className="text-3xl font-bold text-primary/25">{service.title[0]}</span>
                </div>
              )}

              {freelancer?.level === "top_rated" && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-neutral-900 shadow-sm">
                  <Crown className="h-3 w-3 fill-amber-500 text-amber-500" /> Top Rated
                </span>
              )}

              <div onClick={(e) => e.preventDefault()} className="absolute right-3 top-3">
                <SaveButton type="service" id={service._id} className="h-8 w-8 bg-white/95 text-neutral-500 hover:bg-white" />
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImage(i);
                    }}
                    className={cn(
                      "h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                      i === activeImage ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {service.video && (
              <a
                href={service.video}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-[12.5px] font-medium text-neutral-600 transition-colors hover:border-primary/30 hover:text-primary"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Play className="ml-0.5 h-2.5 w-2.5 fill-current" />
                </span>
                Watch intro video
              </a>
            )}
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-col">
            <h3 className="text-xl font-bold leading-snug text-neutral-900">{service.title}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-bold text-neutral-900">{service.rating ? service.rating.toFixed(1) : "0.0"}</span>
              <span className="text-neutral-400">({service.reviewCount} reviews)</span>
            </p>

            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-neutral-500">{service.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-100 pt-4 text-sm">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-bold text-neutral-900">{displayDeliveryDays} Days</span>
                <span className="text-neutral-400">Delivery</span>
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span className="font-bold text-neutral-900">{displayRevisions === -1 ? "Unlimited" : (displayRevisions ?? "—")}</span>
                <span className="text-neutral-400">Revisions</span>
              </span>
              {!!freelancer?.onTimeDeliveryPercent && (
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-bold text-neutral-900">{freelancer.onTimeDeliveryPercent}%</span>
                  <span className="text-neutral-400">Satisfaction</span>
                </span>
              )}
            </div>

            {visibleSkills.length > 0 && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <p className="mb-2 text-xs font-semibold text-neutral-400">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {visibleSkills.map((skill) => {
                    const tech = getTechIcon(skill);
                    const isVerified = freelancer?.verifiedSkills?.some((v) => v.toLowerCase() === skill.toLowerCase());
                    return (
                      <span
                        key={skill}
                        className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[12.5px] font-medium text-neutral-700"
                      >
                        {tech && <tech.icon className="h-3.5 w-3.5 shrink-0" style={{ color: tech.color }} />}
                        {skill}
                        {isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-success" />}
                      </span>
                    );
                  })}
                  {extraSkillCount > 0 && (
                    <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-[12.5px] font-medium text-neutral-500">
                      +{extraSkillCount} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 items-center gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-[1fr_auto_auto]">
              {freelancer && (
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                      <AvatarFallback className="bg-neutral-900 text-sm font-medium text-white">{initialsFromName(freelancer.name)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                        freelancer.availabilityStatus === "busy" ? "bg-amber-500" : "bg-emerald-500"
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-sm font-bold text-neutral-900">
                      {freelancer.name}
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                    </p>
                    <p className="truncate text-xs text-neutral-500">{freelancer.headline || "Freelancer"}</p>
                    {freelancer.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                        <MapPin className="h-3 w-3" /> {freelancer.location}
                      </p>
                    )}
                    {freelancer.level && (
                      <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {LEVEL_LABEL[freelancer.level]}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-5 sm:gap-6">
                <span className="flex flex-col items-center">
                  <span className="flex items-center gap-1 text-base font-bold text-neutral-900">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {freelancer?.jobsCompleted ?? 0}
                  </span>
                  <span className="text-[11px] text-neutral-400">Jobs Done</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="flex items-center gap-1 text-base font-bold text-neutral-900">
                    <ThumbsUp className="h-4 w-4 text-primary" />
                    {service.rating ? Math.round((service.rating / 5) * 100) : 0}%
                  </span>
                  <span className="text-[11px] text-neutral-400">Positive Reviews</span>
                </span>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-xl font-extrabold text-neutral-900">
                  {formatCurrency(displayPrice)}
                  {!cheapestPackage && service.priceType === "hourly" && <span className="text-sm font-normal text-neutral-400">/hr</span>}
                </p>
                <div className="flex w-full gap-2 sm:w-auto">
                  <span className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white transition-transform group-hover:scale-[1.02] sm:flex-none">
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
