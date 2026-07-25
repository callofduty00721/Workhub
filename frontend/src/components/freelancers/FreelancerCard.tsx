import { Link } from "react-router-dom";
import { Star, MapPin, Crown, Award, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { FreelancerSummary } from "@/types";

function SkillsSlider({ skills }: { skills: string[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
      {skills.map((skill) => (
        <Badge key={skill} variant="outline" className="shrink-0 text-[10px]">
          {skill}
        </Badge>
      ))}
    </div>
  );
}

export function FreelancerCard({ freelancer }: { freelancer: FreelancerSummary }) {
  // `location` is saved as "City, State, Country" (EditProfile.tsx) — country
  // is always the last comma-separated segment, so no separate DB field needed.
  const country = freelancer.location?.split(",").map((s) => s.trim()).filter(Boolean).pop();

  return (
    <Link to={`/freelancers/${freelancer._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
              <AvatarFallback>{initialsFromName(freelancer.name)}</AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                freelancer.availabilityStatus === "busy" ? "bg-warning" : "bg-success"
              }`}
              title={freelancer.availabilityStatus === "busy" ? "Busy" : "Available"}
            />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              {freelancer.name}
              {freelancer.level === "top_rated" && <Crown className="h-3.5 w-3.5 shrink-0 text-warning" />}
              {freelancer.level === "level_1" && <Award className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </p>
            <p className="truncate text-xs text-muted-foreground">{freelancer.headline || "Freelancer"}</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {freelancer.category && (
            <Badge variant="secondary" className="w-fit text-[10px]">
              {freelancer.category}
            </Badge>
          )}
          {freelancer.level === "top_rated" && (
            <Badge variant="warning" className="text-[10px]">
              Top Rated
            </Badge>
          )}
          {freelancer.level === "level_1" && (
            <Badge variant="default" className="text-[10px]">
              Level 1
            </Badge>
          )}
          {freelancer.company && (
            <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
              <Users2 className="h-2.5 w-2.5" /> {freelancer.company.name}
            </Badge>
          )}
        </div>

        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          {country && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {country}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" /> {freelancer.rating || "New"}
            {freelancer.reviewCount > 0 && ` (${freelancer.reviewCount})`}
          </span>
        </div>

        <div className="mb-4 flex-1">
          <SkillsSlider skills={freelancer.skills} />
        </div>

        <div className="border-t border-border pt-3 text-xs">
          {freelancer.hourlyRate > 0 ? (
            <span className="font-semibold text-success">{formatCurrency(freelancer.hourlyRate)}/hr</span>
          ) : (
            <span className="text-muted-foreground">Rate on request</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
