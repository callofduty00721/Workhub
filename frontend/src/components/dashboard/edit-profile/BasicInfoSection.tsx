import { Bold, Italic, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/lib/geo";

export function BasicInfoSection({
  avatar,
  setAvatar,
  coverImage,
  setCoverImage,
  headline,
  setHeadline,
  country,
  setCountry,
  state,
  setState,
  city,
  setCity,
  bio,
  bioRef,
  syncBioFromDom,
  applyBioMarker,
}: {
  avatar: string;
  setAvatar: (v: string) => void;
  coverImage: string;
  setCoverImage: (v: string) => void;
  headline: string;
  setHeadline: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  bio: string;
  bioRef: React.RefObject<HTMLDivElement | null>;
  syncBioFromDom: () => void;
  applyBioMarker: (command: "bold" | "italic") => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-3.5 w-3.5" />
          </span>
          Basic Info
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel info="Shown as your circular avatar across the site.">Profile Photo</FieldLabel>
            <div className="max-w-[220px]">
              <FileUpload folder="avatar" value={avatar} onUploaded={(url) => setAvatar(url)} label="Upload profile photo" />
            </div>
            <p className="text-[11px] text-muted-foreground">Recommended: 400 × 400px (square), JPG/PNG/WebP, max 10MB.</p>
          </div>
          <div className="space-y-2">
            <FieldLabel info="A banner image at the top of your profile (optional).">Cover Photo</FieldLabel>
            <div className="max-w-[220px]">
              <FileUpload folder="profile_cover" value={coverImage} onUploaded={(url) => setCoverImage(url)} label="Upload cover photo" />
            </div>
            <p className="text-[11px] text-muted-foreground">Recommended: 1200 × 300px (4:1 ratio), JPG/PNG/WebP, max 10MB.</p>
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="headline" info="A short line about who you are, shown under your name.">
            Headline
          </FieldLabel>
          <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Product Designer, Ex-Google" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <FieldLabel info="The country you live in.">Country</FieldLabel>
            <Select
              value={country}
              onValueChange={(v) => {
                setCountry(v);
                setState("");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel info="The state you live in.">State</FieldLabel>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {(STATES_BY_COUNTRY[country as (typeof COUNTRIES)[number]] ?? []).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="city" info="The city you live in.">City</FieldLabel>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city" />
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="bio" info="Write a little about yourself in simple words.">
            Bio
          </FieldLabel>
          <div className="flex gap-1 rounded-t-lg border border-b-0 border-input bg-muted/40 p-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyBioMarker("bold")}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
              title="Bold"
              aria-label="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyBioMarker("italic")}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
              title="Italic"
              aria-label="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative">
            <div
              id="bio"
              ref={bioRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncBioFromDom}
              className="min-h-[110px] rounded-b-lg rounded-t-none border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {!bio.trim() && (
              <p className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
                Tell people about yourself...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
