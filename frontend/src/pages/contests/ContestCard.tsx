import { Link } from "react-router-dom";
import { Trophy, Clock, Users, Award } from "lucide-react";
import { InfoCell } from "@/components/shared/InfoCell";
import { SaveButton } from "@/components/shared/SaveButton";
import { formatCurrency } from "@/lib/utils";
import type { Contest } from "@/types";

export function ContestCard({ contest }: { contest: Contest }) {
  const daysLeft = Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isClosed = daysLeft <= 0;
  const visibleSkills = contest.skills.slice(0, 4);
  const extraSkillCount = contest.skills.length - visibleSkills.length;

  return (
    <Link to={`/contests/${contest._id}`} className="block h-full min-w-0">
      <div className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-foreground/15 hover:shadow-hover">
        {/* Cover */}
        <div className="relative flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden bg-warning/10">
          <Trophy className="h-9 w-9 text-warning/60" />
          <span
            className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${
              isClosed ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"
            }`}
          >
            {isClosed ? "Closed" : `${daysLeft}d left`}
          </span>
          <div className="absolute left-2.5 top-2.5" onClick={(e) => e.preventDefault()}>
            <SaveButton type="contest" id={contest._id} />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-foreground">{contest.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{contest.category}</p>
          <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{contest.description}</p>

          {/* Info grid */}
          <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-2 rounded-xl bg-muted p-2.5 text-[11px]">
            <InfoCell icon={Trophy} label="Prize" value={formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")} />
            <InfoCell icon={Users} label="Entries" value={String(contest.entriesCount)} />
            <InfoCell icon={Clock} label="Deadline" value={isClosed ? "—" : `${daysLeft}d`} />
          </div>

          {visibleSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {visibleSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-foreground">
                  {skill}
                </span>
              ))}
              {extraSkillCount > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">+{extraSkillCount} more</span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3.5">
            <div className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
              <Award className="h-3.5 w-3.5" /> View Contest
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
