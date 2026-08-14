import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { FileUpload } from "@/components/shared/FileUpload";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { SkillsInput } from "@/components/shared/SkillsInput";
import { SERVICE_CATEGORY_NAMES, SERVICE_SUBCATEGORIES } from "@/lib/mockData";
import type { AvailabilityStatus, User } from "@/types";
import { WORKING_DAYS, TIME_OPTIONS, to12Hour } from "./shared";

export function FreelancerDetailsSection({
  user,
  availabilityStatus,
  setAvailabilityStatus,
  category,
  setCategory,
  subCategory,
  setSubCategory,
  skillsInput,
  setSkillsInput,
  languagesInput,
  setLanguagesInput,
  hourlyRate,
  setHourlyRate,
  yearsOfExperience,
  setYearsOfExperience,
  workingHoursStart,
  setWorkingHoursStart,
  workingHoursEnd,
  setWorkingHoursEnd,
  workingHours,
  setWorkingHours,
  workingDays,
  setWorkingDays,
  responseTimeLabel,
  setResponseTimeLabel,
  phone,
  setPhone,
  videoIntro,
  setVideoIntro,
  website,
  setWebsite,
  github,
  setGithub,
  twitter,
  setTwitter,
}: {
  user: User;
  availabilityStatus: AvailabilityStatus;
  setAvailabilityStatus: (v: AvailabilityStatus) => void;
  category: string;
  setCategory: (v: string) => void;
  subCategory: string;
  setSubCategory: (v: string) => void;
  skillsInput: string;
  setSkillsInput: (v: string) => void;
  languagesInput: string;
  setLanguagesInput: (v: string) => void;
  hourlyRate: number;
  setHourlyRate: (v: number) => void;
  yearsOfExperience: number;
  setYearsOfExperience: (v: number) => void;
  workingHoursStart: string;
  setWorkingHoursStart: (v: string) => void;
  workingHoursEnd: string;
  setWorkingHoursEnd: (v: string) => void;
  workingHours: string;
  setWorkingHours: (v: string) => void;
  workingDays: string[];
  setWorkingDays: (updater: (prev: string[]) => string[]) => void;
  responseTimeLabel: string;
  setResponseTimeLabel: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  videoIntro: string;
  setVideoIntro: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  github: string;
  setGithub: (v: string) => void;
  twitter: string;
  setTwitter: (v: string) => void;
}) {
  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase className="h-3.5 w-3.5" />
              </span>
              Freelancer Details
            </h3>
            <div className="flex items-center gap-2 rounded-full border border-border p-1">
              <button
                type="button"
                onClick={() => setAvailabilityStatus("available")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  availabilityStatus === "available" ? "bg-success text-success-foreground" : "text-muted-foreground"
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityStatus("busy")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  availabilityStatus === "busy" ? "bg-warning text-warning-foreground" : "text-muted-foreground"
                }`}
              >
                Busy
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel info="The category your work falls under.">Category</FieldLabel>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setSubCategory("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORY_NAMES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel info="A more specific type within your category.">Sub-Category</FieldLabel>
              {category && SERVICE_SUBCATEGORIES[category]?.length ? (
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_SUBCATEGORIES[category].map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="flex h-9 items-center text-xs text-muted-foreground">Select a category first.</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel info="Add skills separated by commas.">
              Skills (comma separated)
            </FieldLabel>
            <SkillsInput value={skillsInput} onChange={setSkillsInput} placeholder="React, Node.js, UI Design" />
          </div>
          <div className="space-y-2">
            <FieldLabel info="Languages you can communicate in — shown on your profile so clients know before reaching out.">
              Languages (comma separated)
            </FieldLabel>
            <Input value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} placeholder="English, Marathi, Hindi" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel info="Your usual rate per hour.">Hourly Rate (₹)</FieldLabel>
              <Input type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <FieldLabel info="How many years you've been working.">Years of Experience</FieldLabel>
              <Input type="number" min={0} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <FieldLabel info="The hours you usually work each day.">
                Working Hours
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Select
                  value={workingHoursStart}
                  onValueChange={(v) => {
                    setWorkingHoursStart(v);
                    setWorkingHours([to12Hour(v), to12Hour(workingHoursEnd)].filter(Boolean).join(" - "));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">to</span>
                <Select
                  value={workingHoursEnd}
                  onValueChange={(v) => {
                    setWorkingHoursEnd(v);
                    setWorkingHours([to12Hour(workingHoursStart), to12Hour(v)].filter(Boolean).join(" - "));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {workingHours && <p className="text-[11px] text-muted-foreground">Shown on profile as: {workingHours}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel info="The days you usually work.">Working Days</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start font-normal">
                    {workingDays.length > 0 ? workingDays.join(", ") : "Select working days"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  {WORKING_DAYS.map((day) => (
                    <DropdownMenuCheckboxItem
                      key={day}
                      checked={workingDays.includes(day)}
                      onCheckedChange={(checked) =>
                        setWorkingDays((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)))
                      }
                    >
                      {day}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <FieldLabel info="Shows how often you deliver work on time. This is calculated automatically.">
                On-Time Delivery (%)
              </FieldLabel>
              <Input type="number" value={user?.onTimeDeliveryPercent ?? 0} disabled />
              <p className="text-[11px] text-muted-foreground">Calculated automatically from your delivered orders — not editable.</p>
            </div>
            <div className="space-y-2">
              <FieldLabel info="How fast you usually reply to messages.">
                Typical Response Time
              </FieldLabel>
              <Input value={responseTimeLabel} onChange={(e) => setResponseTimeLabel(e.target.value)} placeholder="1 Hour" />
            </div>
            <div className="space-y-2">
              <FieldLabel info="Kept private — used only for verification and alerts.">Phone Number</FieldLabel>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel info="Your account's email — filled in automatically, not editable here.">Email ID</FieldLabel>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <FieldLabel info="Your portfolio or personal website, shown as a link on your card and profile.">Website</FieldLabel>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" />
            </div>
            <div className="space-y-2">
              <FieldLabel info="Your GitHub profile, shown as a link on your card and profile.">GitHub</FieldLabel>
              <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/yourhandle" />
            </div>
            <div className="space-y-2">
              <FieldLabel info="Your Twitter (X) profile, shown as a link on your card and profile.">Twitter (X)</FieldLabel>
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/yourhandle" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Working hours and response time are self-reported and shown as-is on your public profile.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-5">
          <h3 className="text-sm font-semibold">Video Introduction</h3>
          <p className="text-xs text-muted-foreground">
            A short video helps clients get a feel for you before they hire — max 50MB, 60 seconds.
          </p>
          <FileUpload
            folder="profile_video"
            accept="video/*"
            value={videoIntro}
            onUploaded={(url) => setVideoIntro(url)}
            label="Click to upload your intro video"
          />
          {videoIntro && <video src={videoIntro} controls className="mt-2 max-h-64 w-full rounded-lg border border-border" />}
        </CardContent>
      </Card>
    </>
  );
}
