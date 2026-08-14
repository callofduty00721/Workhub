import { useState } from "react";
import { Plus, Linkedin } from "lucide-react";
import { initialsFromName } from "@/lib/utils";
import type { OpenRole, TeamMember } from "@/types";
import { SectionCard, EmptyNote } from "./shared";

const WORK_MODE_LABELS: Record<string, string> = { on_site: "On-site", remote: "Remote", hybrid: "Hybrid" };
const ROLE_AVATAR_COLORS = [
  { from: "#2563eb", to: "#1e3a8a" },
  { from: "#22c55e", to: "#166534" },
  { from: "#f97316", to: "#7c2d12" },
  { from: "#a855f7", to: "#581c87" },
];

export function TeamTab({
  openRoles,
  team,
  onOpenModal,
  onViewDetails,
}: {
  openRoles: OpenRole[];
  team: TeamMember[];
  onOpenModal: (role: OpenRole | null) => void;
  onViewDetails: (role: OpenRole) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleRoles = showAll ? openRoles : openRoles.slice(0, 6);

  return (
    <div className="space-y-5">
      <SectionCard title="Team (Looking For)">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-md text-[12.5px] text-muted-foreground">
            We&apos;re looking for the right and dedicated people for these roles.
          </p>
          <button
            onClick={() => onOpenModal(null)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[12px] font-bold text-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Suggest a Member
          </button>
        </div>

        {openRoles.length === 0 ? (
          <EmptyNote text="No open roles right now." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleRoles.map((role, i) => {
                const color = ROLE_AVATAR_COLORS[i % ROLE_AVATAR_COLORS.length];
                return (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: `linear-gradient(155deg, ${color.from}, ${color.to})` }}
                      >
                        {initialsFromName(role.title)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold">{role.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {role.type === "full_time" ? "Full Time" : "Part Time"} · {WORK_MODE_LABELS[role.workMode]}
                        </p>
                      </div>
                    </div>
                    {role.description && <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">{role.description}</p>}
                    {(role.requiredSkills?.length ?? 0) > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {role.requiredSkills!.map((skill) => (
                          <span key={skill} className="rounded-full bg-brand/10 px-2 py-0.5 text-[10.5px] font-semibold text-brand">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(role)}
                        className="rounded-lg border border-border px-3.5 py-1.5 text-[12px] font-bold text-foreground hover:bg-muted"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onOpenModal(role)}
                        className="rounded-lg border border-primary px-3.5 py-1.5 text-[12px] font-bold text-primary hover:bg-muted"
                      >
                        Join Team
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {openRoles.length > 6 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-4 w-full rounded-lg border border-border py-2.5 text-[12.5px] font-bold text-foreground hover:bg-muted"
              >
                {showAll ? "Show Fewer Roles" : "View All Roles"}
              </button>
            )}
          </>
        )}
      </SectionCard>

      {team.length > 0 && (
        <SectionCard title="Our Team">
          <div className="grid gap-4 sm:grid-cols-2">
            {team.map((member, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">
                  {member.avatar ? <img src={member.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : member.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">{member.name}</p>
                  <p className="text-[11.5px] font-semibold text-foreground">{member.role}</p>
                  {member.joinedDate && (
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground/70">
                      Joined {new Date(member.joinedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  )}
                  {member.bio && <p className="mt-1 text-[11.5px] text-muted-foreground">{member.bio}</p>}
                  {(member.skills?.length ?? 0) > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {member.skills!.map((skill) => (
                        <span key={skill} className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="mt-1 inline-block text-foreground">
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
