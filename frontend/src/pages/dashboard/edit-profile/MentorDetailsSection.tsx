import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { FieldLabel } from "@/components/shared/FieldInfo";
import type { MentorSessionFormat } from "@/types";
import { WORKING_DAYS } from "./shared";

export function MentorDetailsSection({
  expertiseInput,
  setExpertiseInput,
  sessionRate,
  setSessionRate,
  sessionFormat,
  setSessionFormat,
  linkedIn,
  setLinkedIn,
  hoursPerWeekAvailable,
  setHoursPerWeekAvailable,
  workingDays,
  setWorkingDays,
}: {
  expertiseInput: string;
  setExpertiseInput: (v: string) => void;
  sessionRate: number;
  setSessionRate: (v: number) => void;
  sessionFormat: MentorSessionFormat;
  setSessionFormat: (v: MentorSessionFormat) => void;
  linkedIn: string;
  setLinkedIn: (v: string) => void;
  hoursPerWeekAvailable: number;
  setHoursPerWeekAvailable: (v: number) => void;
  workingDays: string[];
  setWorkingDays: (updater: (prev: string[]) => string[]) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Mentor Details</h3>
        <div className="space-y-2">
          <Label>Areas of Expertise (comma separated)</Label>
          <Input value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} placeholder="Fundraising, Growth, Product" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Session Rate (₹, 0 for free)</Label>
            <Input type="number" min={0} value={sessionRate} onChange={(e) => setSessionRate(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Session Format</Label>
            <Select value={sessionFormat} onValueChange={(v) => setSessionFormat(v as MentorSessionFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>LinkedIn</Label>
          <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="space-y-2">
          <FieldLabel info="How many hours a week you're available to mentor.">Hours/Week Available</FieldLabel>
          <Input type="number" min={0} value={hoursPerWeekAvailable} onChange={(e) => setHoursPerWeekAvailable(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <FieldLabel info="The days you're usually free for sessions.">Available Days</FieldLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-start font-normal">
                {workingDays.length > 0 ? workingDays.join(", ") : "Select available days"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              {WORKING_DAYS.map((day) => (
                <DropdownMenuCheckboxItem
                  key={day}
                  checked={workingDays.includes(day)}
                  onCheckedChange={(checked) => setWorkingDays((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)))}
                >
                  {day}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
