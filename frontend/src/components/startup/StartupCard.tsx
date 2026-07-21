import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, ShieldCheck, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startupApi } from "@/api/startups";
import { useAuth } from "@/context/AuthContext";
import { cn, formatFundingCompact } from "@/lib/utils";
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

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative h-32 bg-gradient-to-br from-primary/25 via-secondary/15 to-primary/5">
        {startup.coverImage && (
          <img src={startup.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {startup.isFeatured && (
          <Badge variant="solid" className="absolute left-2.5 top-2.5 text-[10px] uppercase tracking-wide">
            Featured
          </Badge>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (user) followMutation.mutate();
          }}
          disabled={!user || followMutation.isPending}
          aria-label="Save startup"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm transition-colors hover:text-danger disabled:cursor-not-allowed"
        >
          <Heart className={cn("h-4 w-4", isFollowing && "fill-danger text-danger")} />
        </button>
        <div className="absolute -bottom-5 left-4 flex h-11 w-11 items-center justify-center rounded-lg border-2 border-card bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-soft">
          {startup.name[0]}
        </div>
      </div>

      <Link to={`/startups/${startup._id}`} className="flex flex-1 flex-col p-4 pt-7">
        <div className="mb-1.5 flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{startup.name}</p>
          {startup.isVerified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </div>
        <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground">{startup.tagline}</p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {startup.industry}
          </Badge>
        </div>

        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {startup.location}
          <span className="mx-1">·</span>
          {STAGE_LABELS[startup.stage]}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <div>
            <p className="text-muted-foreground">Funding Raised</p>
            <p className="font-semibold text-success">{formatFundingCompact(startup.fundingRaised)}</p>
          </div>
          <span className="flex items-center gap-1 font-medium">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            {startup.reviewCount > 0 ? startup.rating.toFixed(1) : "New"}
          </span>
        </div>
      </Link>
    </Card>
  );
}
