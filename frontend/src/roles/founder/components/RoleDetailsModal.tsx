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
              <p className="mb-1 text-[12px] font-bold text-[#0f172a]">Role Description</p>
              <p className="text-[12.5px] leading-relaxed text-[#64748b]">{role.description}</p>
            </div>
          )}

          {(role.responsibilities?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-[#0f172a]">What You'll Work On</p>
              <ul className="space-y-1.5">
                {role.responsibilities!.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#334155]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-lg border border-[#e2e8f0] p-3">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" />
              <div>
                <p className="text-[11px] font-semibold text-[#94a3b8]">Required Experience</p>
                <p className="text-[12.5px] font-medium text-[#0f172a]">{role.requiredExperience || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#e2e8f0] p-3">
              <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-[#FA832E]" />
              <div>
                <p className="text-[11px] font-semibold text-[#94a3b8]">Salary / Compensation</p>
                <p className="text-[12.5px] font-medium text-[#0f172a]">{role.salary || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#e2e8f0] p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
              <div>
                <p className="text-[11px] font-semibold text-[#94a3b8]">Work Mode</p>
                <p className="text-[12.5px] font-medium text-[#0f172a]">{WORK_MODE_LABELS[role.workMode]}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#e2e8f0] p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
              <div>
                <p className="text-[11px] font-semibold text-[#94a3b8]">Type</p>
                <p className="text-[12.5px] font-medium text-[#0f172a]">{role.type === "full_time" ? "Full Time" : "Part Time"}</p>
              </div>
            </div>
          </div>

          {(role.requiredSkills?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-[#0f172a]">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {role.requiredSkills!.map((skill) => (
                  <span key={skill} className="rounded-full bg-[#f1ebfc] px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed]">
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
            className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onJoin}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-[12.5px] font-bold text-white hover:opacity-90"
          >
            Join Team
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
