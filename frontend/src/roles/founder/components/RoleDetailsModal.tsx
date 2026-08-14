import { Briefcase, IndianRupee, MapPin, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { OpenRole } from "@/types";

const WORK_MODE_LABELS: Record<string, string> = { on_site: "On-site", remote: "Remote", hybrid: "Hybrid" };

export function RoleDetailsModal({
  role,
  open,
  onOpenChange,
  onJoin,
}: {
  role: OpenRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: () => void;
}) {
  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role.title}</DialogTitle>
          <DialogDescription>
            {role.type === "full_time" ? "Full Time" : "Part Time"} · {WORK_MODE_LABELS[role.workMode]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {role.description && (
            <div>
              <p className="mb-1 text-[12px] font-bold text-foreground">Role Description</p>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">{role.description}</p>
            </div>
          )}

          {(role.responsibilities?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-foreground">What You'll Work On</p>
              <ul className="space-y-1.5">
                {role.responsibilities!.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/70">Required Experience</p>
                <p className="text-[12.5px] font-medium text-foreground">{role.requiredExperience || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-[#FA832E]" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/70">Salary / Compensation</p>
                <p className="text-[12.5px] font-medium text-foreground">{role.salary || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/70">Work Mode</p>
                <p className="text-[12.5px] font-medium text-foreground">{WORK_MODE_LABELS[role.workMode]}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/70">Type</p>
                <p className="text-[12.5px] font-medium text-foreground">{role.type === "full_time" ? "Full Time" : "Part Time"}</p>
              </div>
            </div>
          </div>

          {(role.requiredSkills?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-foreground">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {role.requiredSkills!.map((skill) => (
                  <span key={skill} className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-bold text-foreground hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onJoin}
            className="rounded-lg bg-primary px-4 py-2 text-[12.5px] font-bold text-primary-foreground hover:opacity-90"
          >
            Join Team
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
