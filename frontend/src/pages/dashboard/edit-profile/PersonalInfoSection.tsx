import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PersonalInfoSection({
  dateOfBirth,
  setDateOfBirth,
  nationality,
  setNationality,
  educationLevel,
  setEducationLevel,
  languagesInput,
  setLanguagesInput,
}: {
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  nationality: string;
  setNationality: (v: string) => void;
  educationLevel: string;
  setEducationLevel: (v: string) => void;
  languagesInput: string;
  setLanguagesInput: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Personal Info</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nationality</Label>
            <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Indian" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Education Level</Label>
          <Input value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} placeholder="Post Graduate" />
        </div>
        <div className="space-y-2">
          <Label>Languages (comma separated)</Label>
          <Input value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} placeholder="English, Marathi, Hindi" />
        </div>
      </CardContent>
    </Card>
  );
}
