import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Users2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/FileUpload";
import { teamApplicationApi } from "@/api/teamApplications";
import type { OpenRole } from "@/types";

const WORK_MODE_LABELS: Record<string, string> = { on_site: "On-site", remote: "Remote", hybrid: "Hybrid" };

export function JoinTeamModal({
  startupId,
  role,
  open,
  onOpenChange,
}: {
  startupId: string;
  role: OpenRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [customTitle, setCustomTitle] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const isCustom = !role;
  const roleTitle = role?.title ?? customTitle;

  const reset = () => {
    setCustomTitle("");
    setBio("");
    setExperience("");
    setSkillsInput("");
    setResumeUrl("");
  };

  const mutation = useMutation({
    mutationFn: () =>
      teamApplicationApi.create(startupId, {
        roleTitle,
        roleType: role?.type ?? "full_time",
        isCustomRole: isCustom,
        bio,
        experience,
        skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
        resumeUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "team-applications"] });
      reset();
      onOpenChange(false);
    },
  });

  const canSubmit = roleTitle.trim() && bio.trim() && experience.trim() && skillsInput.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCustom ? "Suggest a Member" : "Join Team"}</DialogTitle>
          <DialogDescription>
            {isCustom ? "Suggest a role you think this startup needs, and apply for it yourself." : "Apply to join the team for this role."}
          </DialogDescription>
        </DialogHeader>

        {role ? (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Users2 className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-foreground">{role.title}</p>
              <p className="text-[11.5px] text-muted-foreground">
                {role.type === "full_time" ? "Full Time" : "Part Time"} · {WORK_MODE_LABELS[role.workMode]}
              </p>
              {(role.requiredSkills?.length ?? 0) > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {role.requiredSkills!.map((skill) => (
                    <span key={skill} className="rounded-full bg-card px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="customTitle">Role you'd like to suggest</Label>
            <Input id="customTitle" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. Social Media Manager" />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell them a bit about yourself..." className="min-h-[70px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="experience">Your Experience</Label>
            <Textarea id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Share your relevant experience..." className="min-h-[70px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skills">Skills</Label>
            <Input id="skills" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="e.g. Dairy Management, Team Handling, Operations..." />
          </div>
          <div className="space-y-1.5">
            <Label>Resume / CV (optional)</Label>
            <FileUpload folder="resume" accept="application/pdf,.doc,.docx" value={resumeUrl} onUploaded={(url) => setResumeUrl(url)} label="Upload Resume / CV — PDF, DOC, DOCX (Max 5MB)" />
          </div>
        </div>

        {mutation.isError && (
          <p className="mt-3 text-xs text-danger">
            {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong. Please try again."}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-bold text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Send Application
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
