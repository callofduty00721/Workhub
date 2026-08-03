import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkillsInput } from "@/components/shared/SkillsInput";
import type { FounderStage } from "@/types";

export function FounderDetailsSection({
  founderStage,
  setFounderStage,
  linkedIn,
  setLinkedIn,
  twitter,
  setTwitter,
  github,
  setGithub,
  website,
  setWebsite,
  industriesInput,
  setIndustriesInput,
  skillsInput,
  setSkillsInput,
  roleTagsInput,
  setRoleTagsInput,
  lookingForInput,
  setLookingForInput,
  pastStartupsCount,
  setPastStartupsCount,
  yearsOfExperience,
  setYearsOfExperience,
}: {
  founderStage: FounderStage;
  setFounderStage: (v: FounderStage) => void;
  linkedIn: string;
  setLinkedIn: (v: string) => void;
  twitter: string;
  setTwitter: (v: string) => void;
  github: string;
  setGithub: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  industriesInput: string;
  setIndustriesInput: (v: string) => void;
  skillsInput: string;
  setSkillsInput: (v: string) => void;
  roleTagsInput: string;
  setRoleTagsInput: (v: string) => void;
  lookingForInput: string;
  setLookingForInput: (v: string) => void;
  pastStartupsCount: number;
  setPastStartupsCount: (v: number) => void;
  yearsOfExperience: number;
  setYearsOfExperience: (v: number) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Founder Details</h3>
          <div className="flex items-center gap-2 rounded-full border border-border p-1">
            <button
              type="button"
              onClick={() => setFounderStage("idea")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                founderStage === "idea" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Idea Stage
            </button>
            <button
              type="button"
              onClick={() => setFounderStage("registered")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                founderStage === "registered" ? "bg-success text-success-foreground" : "text-muted-foreground"
              }`}
            >
              Registered
            </button>
          </div>
        </div>
        <p className="-mt-3 text-xs text-muted-foreground">
          {founderStage === "idea"
            ? "Idea stage: free to look for a co-founder or team. Posting a paid job or pitching investors still needs a verified account."
            : "Registered: your startup is a legal entity. Paid job posts and investor pitches still need a verified account."}
        </p>
        <div className="space-y-2">
          <Label>LinkedIn</Label>
          <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Twitter (X)</Label>
            <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." />
          </div>
          <div className="space-y-2">
            <Label>GitHub</Label>
            <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Industries of Interest (comma separated)</Label>
          <Input value={industriesInput} onChange={(e) => setIndustriesInput(e.target.value)} placeholder="FinTech, EdTech, SaaS" />
        </div>
        <div className="space-y-2">
          <Label>Skills & Expertise (comma separated)</Label>
          <SkillsInput value={skillsInput} onChange={setSkillsInput} placeholder="Product Strategy, Fundraising, Leadership" />
        </div>
        <div className="space-y-2">
          <Label>Role Tags (comma separated)</Label>
          <Input value={roleTagsInput} onChange={(e) => setRoleTagsInput(e.target.value)} placeholder="Entrepreneur, Leader, Problem Solver" />
        </div>
        <div className="space-y-2">
          <Label>Looking For (comma separated)</Label>
          <Input value={lookingForInput} onChange={(e) => setLookingForInput(e.target.value)} placeholder="Co-Founder, Investor, Mentor, Advisor" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Past Startups Founded</Label>
            <Input
              type="number"
              min={0}
              value={pastStartupsCount}
              onChange={(e) => setPastStartupsCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Years of Experience</Label>
            <Input type="number" min={0} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(Number(e.target.value))} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
