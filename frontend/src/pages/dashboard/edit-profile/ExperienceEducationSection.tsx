import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ExperienceEntry, EducationEntry, AchievementEntry, UserRole } from "@/types";

export function ExperienceEducationSection({
  role,
  experience,
  addExperience,
  removeExperience,
  updateExperience,
  education,
  addEducation,
  removeEducation,
  updateEducation,
  achievements,
  addAchievement,
  removeAchievement,
  updateAchievement,
}: {
  role: UserRole;
  experience: ExperienceEntry[];
  addExperience: () => void;
  removeExperience: (index: number) => void;
  updateExperience: (index: number, patch: Partial<ExperienceEntry>) => void;
  education: EducationEntry[];
  addEducation: () => void;
  removeEducation: (index: number) => void;
  updateEducation: (index: number, patch: Partial<EducationEntry>) => void;
  achievements: AchievementEntry[];
  addAchievement: () => void;
  removeAchievement: (index: number) => void;
  updateAchievement: (index: number, patch: Partial<AchievementEntry>) => void;
}) {
  return (
    <>
      <Card id="skills">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Experience Timeline</h3>
            <Button variant="outline" size="sm" onClick={addExperience}>
              <Plus className="h-3.5 w-3.5" /> Add Experience
            </Button>
          </div>

          {experience.length === 0 && <p className="text-sm text-muted-foreground">No experience added yet.</p>}

          {experience.map((exp, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                <button type="button" onClick={() => removeExperience(i)} className="text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} placeholder="Founder & CEO" />
                </div>
                <div className="space-y-1.5">
                  <Label>Company / Startup</Label>
                  <Input value={exp.company} onChange={(e) => updateExperience(i, { company: e.target.value })} placeholder="TechNova Solutions" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={exp.location} onChange={(e) => updateExperience(i, { location: e.target.value })} placeholder="Pune, India" />
                </div>
                <div className="space-y-1.5">
                  <Label>Start</Label>
                  <Input value={exp.startLabel} onChange={(e) => updateExperience(i, { startLabel: e.target.value })} placeholder="Jan 2021" />
                </div>
                <div className="space-y-1.5">
                  <Label>End (or "Present")</Label>
                  <Input value={exp.endLabel} onChange={(e) => updateExperience(i, { endLabel: e.target.value })} placeholder="Present" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(i, { description: e.target.value })}
                  placeholder="What did you build or achieve in this role?"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Education</h3>
            <Button variant="outline" size="sm" onClick={addEducation}>
              <Plus className="h-3.5 w-3.5" /> Add Education
            </Button>
          </div>

          {education.length === 0 && <p className="text-sm text-muted-foreground">No education added yet.</p>}

          {education.map((edu, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                <button type="button" onClick={() => removeEducation(i)} className="text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Degree</Label>
                  <Input value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} placeholder="MBA in Marketing" />
                </div>
                <div className="space-y-1.5">
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(i, { institution: e.target.value })}
                    placeholder="Savitribai Phule Pune University"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Start Year</Label>
                  <Input value={edu.startLabel} onChange={(e) => updateEducation(i, { startLabel: e.target.value })} placeholder="2016" />
                </div>
                <div className="space-y-1.5">
                  <Label>End Year</Label>
                  <Input value={edu.endLabel} onChange={(e) => updateEducation(i, { endLabel: e.target.value })} placeholder="2018" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{role === "freelancer" ? "Certificates" : "Achievements"}</h3>
            <Button variant="outline" size="sm" onClick={addAchievement}>
              <Plus className="h-3.5 w-3.5" /> Add {role === "freelancer" ? "Certificate" : "Achievement"}
            </Button>
          </div>

          {achievements.length === 0 && <p className="text-sm text-muted-foreground">No achievements added yet.</p>}

          {achievements.map((a, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                <button type="button" onClick={() => removeAchievement(i)} className="text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={a.title}
                    onChange={(e) => updateAchievement(i, { title: e.target.value })}
                    placeholder="Winner - Smart India Hackathon"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Input value={a.dateLabel} onChange={(e) => updateAchievement(i, { dateLabel: e.target.value })} placeholder="2022" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Input value={a.description} onChange={(e) => updateAchievement(i, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
