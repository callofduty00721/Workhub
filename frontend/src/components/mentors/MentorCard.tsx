import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { MentorSummary } from "@/types";

export function MentorCard({ mentor }: { mentor: MentorSummary }) {
  return (
    <Link to={`/mentors/${mentor._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={mentor.avatar} alt={mentor.name} />
            <AvatarFallback>{initialsFromName(mentor.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{mentor.name}</p>
            <p className="truncate text-xs text-muted-foreground">{mentor.headline || "Mentor"}</p>
          </div>
        </div>
        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          {mentor.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {mentor.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" /> {mentor.rating || "New"}
            {mentor.reviewCount > 0 && ` (${mentor.reviewCount})`}
          </span>
        </div>
        <div className="mb-4 flex flex-1 flex-wrap gap-1.5">
          {mentor.expertise.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="border-t border-border pt-3 text-xs">
          {mentor.sessionRate > 0 ? (
            <span className="font-semibold text-success">{formatCurrency(mentor.sessionRate)}/session</span>
          ) : (
            <span className="text-muted-foreground">Free sessions</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
