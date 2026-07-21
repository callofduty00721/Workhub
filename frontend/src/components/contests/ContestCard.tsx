import { Link } from "react-router-dom";
import { Trophy, Clock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Contest } from "@/types";

export function ContestCard({ contest }: { contest: Contest }) {
  const daysLeft = Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Link to={`/contests/${contest._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{contest.title}</p>
            <p className="truncate text-xs text-muted-foreground">{contest.category}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
            {contest.status}
          </Badge>
        </div>

        <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{contest.description}</p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {contest.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {contest.entriesCount} entries
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {daysLeft > 0 ? `${daysLeft}d left` : "Closed"}
          </span>
          <span className="flex items-center gap-1 font-semibold text-success">
            <Trophy className="h-3.5 w-3.5" />
            {formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")}
          </span>
        </div>
      </Card>
    </Link>
  );
}
