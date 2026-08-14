import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/FileUpload";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { SkillsInput } from "@/components/shared/SkillsInput";

export function JobSeekerDetailsSection({
  desiredRole,
  setDesiredRole,
  skillsInput,
  setSkillsInput,
  yearsOfExperience,
  setYearsOfExperience,
  expectedSalary,
  setExpectedSalary,
  noticePeriodDays,
  setNoticePeriodDays,
  preferredLocationsInput,
  setPreferredLocationsInput,
  willingToRelocate,
  setWillingToRelocate,
  resumeUrl,
  setResumeUrl,
}: {
  desiredRole: string;
  setDesiredRole: (v: string) => void;
  skillsInput: string;
  setSkillsInput: (v: string) => void;
  yearsOfExperience: number;
  setYearsOfExperience: (v: number) => void;
  expectedSalary: number;
  setExpectedSalary: (v: number) => void;
  noticePeriodDays: number;
  setNoticePeriodDays: (v: number) => void;
  preferredLocationsInput: string;
  setPreferredLocationsInput: (v: string) => void;
  willingToRelocate: boolean;
  setWillingToRelocate: (v: boolean) => void;
  resumeUrl: string;
  setResumeUrl: (v: string) => void;
}) {
  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="text-sm font-semibold">Job Seeker Details</h3>
          <div className="space-y-2">
            <Label>Desired Role</Label>
            <Input value={desiredRole} onChange={(e) => setDesiredRole(e.target.value)} placeholder="e.g. Frontend Developer" />
          </div>
          <div className="space-y-2">
            <FieldLabel info="Shown on your public profile and used to match you to relevant jobs.">Skills (comma separated)</FieldLabel>
            <SkillsInput value={skillsInput} onChange={setSkillsInput} placeholder="React, Node.js, SQL" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input type="number" min={0} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Expected Salary (₹ / year)</Label>
              <Input type="number" min={0} value={expectedSalary} onChange={(e) => setExpectedSalary(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notice Period (days)</Label>
            <Input type="number" min={0} value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Preferred Locations (comma separated)</Label>
            <Input value={preferredLocationsInput} onChange={(e) => setPreferredLocationsInput(e.target.value)} placeholder="Pune, Mumbai, Remote" />
          </div>
          <label className="flex w-fit items-center gap-2 text-sm">
            <input type="checkbox" checked={willingToRelocate} onChange={(e) => setWillingToRelocate(e.target.checked)} className="h-4 w-4" />
            Willing to relocate
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-5">
          <h3 className="text-sm font-semibold">Resume</h3>
          <p className="text-xs text-muted-foreground">Upload a PDF resume for employers to view on your profile.</p>
          <FileUpload
            folder="resume"
            accept="application/pdf"
            value={resumeUrl}
            onUploaded={(url) => setResumeUrl(url)}
            label="Click to upload your resume (PDF)"
          />
        </CardContent>
      </Card>
    </>
  );
}
