import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { FreelancerSummary } from "@/types";

export function FreelancerCard({ freelancer }: { freelancer: FreelancerSummary }) {
  return (
    <Link to={`/freelancers/${freelancer._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
            <AvatarFallback>{initialsFromName(freelancer.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{freelancer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{freelancer.headline || "Freelancer"}</p>
          </div>
        </div>

        {freelancer.category && (
          <Badge variant="secondary" className="mb-3 w-fit text-[10px]">
            {freelancer.category}
          </Badge>
        )}

        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          {freelancer.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {freelancer.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" /> {freelancer.rating || "New"}
            {freelancer.reviewCount > 0 && ` (${freelancer.reviewCount})`}
          </span>
        </div>

        <div className="mb-4 flex flex-1 flex-wrap gap-1.5">
          {freelancer.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">
              {skill}
            </Badge>
          ))}
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
