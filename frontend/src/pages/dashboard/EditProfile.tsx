import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Plus, Trash2, ExternalLink, FileText, X, ShieldCheck, ShieldAlert, Clock, BadgeCheck, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/shared/FileUpload";
import { FormGuidelines } from "@/components/shared/FormGuidelines";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { userApi } from "@/api/users";
import { paymentApi } from "@/api/payments";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";
import type { PartnerType, ExperienceEntry, EducationEntry, AchievementEntry, PortfolioItem, WithdrawalMethod, AvailabilityStatus } from "@/types";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/lib/geo";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";

const EMPTY_EXPERIENCE: ExperienceEntry = { title: "", company: "", location: "", startLabel: "", endLabel: "Present", description: "" };
const EMPTY_EDUCATION: EducationEntry = { degree: "", institution: "", startLabel: "", endLabel: "" };
const EMPTY_ACHIEVEMENT: AchievementEntry = { title: "", description: "", dateLabel: "" };
const EMPTY_PORTFOLIO_ITEM: PortfolioItem = { title: "", description: "", image: "", link: "", tags: [], clientName: "", projectRole: "" };
const TYPE_LABELS: Record<string, string> = { gig_order: "Gig Order", job_hire: "Job / Project", contest_prize: "Contest Prize" };
const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// "9:00 AM - 6:00 PM" (display string, what's actually saved) <-> "09:00"/"18:00"
// (24h values <input type="time"> needs) — converts between the two so the
// picker can be pre-filled from an existing profile and still save the same
// human-readable format shown elsewhere.
function to24Hour(label: string): string {
  const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "";
  let [, h, m, ampm] = match;
  let hour = Number(h);
  if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${m}`;
}

function to12Hour(value: string): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// 30-minute-increment options for the Working Hours dropdowns — { value:
// "09:00" (24h, used internally) label: "9:00 AM" (shown in the list) }.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const value = `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
  return { value, label: to12Hour(value) };
});

const DASHBOARD_ROLES: DashboardRole[] = [
  "founder",
  "freelancer",
  "employer",
  "super_admin",
  "investor",
  "mentor",
  "partner",
  "client",
];

const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  { value: "accelerator", label: "Accelerator" },
  { value: "incubator", label: "Incubator" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
  { value: "service_provider", label: "Service Provider" },
];

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const sidebarRole: DashboardRole = DASHBOARD_ROLES.includes(user?.role as DashboardRole) ? (user!.role as DashboardRole) : "founder";

  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [coverImage, setCoverImage] = useState(user?.coverImage ?? "");
  const [headline, setHeadline] = useState(user?.headline ?? "");
  const locationParts = (user?.location ?? "").split(",").map((s) => s.trim());
  const [city, setCity] = useState(locationParts[0] ?? "");
  const [state, setState] = useState(locationParts[1] ?? "");
  const [country, setCountry] = useState(locationParts[2] || "India");
  const [bio, setBio] = useState(user?.bio ?? "");

  // Freelancer
  const [category, setCategory] = useState(user?.category ?? "");
  const [subCategory, setSubCategory] = useState(user?.subCategory ?? "");
  const [skillsInput, setSkillsInput] = useState(user?.skills?.join(", ") ?? "");
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate ?? 0);
  const [yearsOfExperience, setYearsOfExperience] = useState(user?.yearsOfExperience ?? 0);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(user?.availabilityStatus ?? "available");
  const [workingDays, setWorkingDays] = useState<string[]>(user?.workingDays ?? []);
  const [workingHours, setWorkingHours] = useState(user?.workingHours ?? "");
  const [workingHoursStart, setWorkingHoursStart] = useState(() => to24Hour(user?.workingHours?.split("-")[0] ?? ""));
  const [workingHoursEnd, setWorkingHoursEnd] = useState(() => to24Hour(user?.workingHours?.split("-")[1] ?? ""));
  const [responseTimeLabel, setResponseTimeLabel] = useState(user?.responseTimeLabel ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [resumeUrl, setResumeUrl] = useState(user?.resumeUrl ?? "");
  const [videoIntro, setVideoIntro] = useState(user?.videoIntro ?? "");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(user?.portfolioItems ?? []);
  const [payoutMethod, setPayoutMethod] = useState<WithdrawalMethod>(user?.payoutDetails?.preferredMethod ?? "upi");
  const [payoutUpiId, setPayoutUpiId] = useState(user?.payoutDetails?.upiId ?? "");
  const [payoutBankAccountNumber, setPayoutBankAccountNumber] = useState(user?.payoutDetails?.bankAccountNumber ?? "");
  const [payoutBankIfsc, setPayoutBankIfsc] = useState(user?.payoutDetails?.bankIfsc ?? "");
  const [payoutBankAccountHolder, setPayoutBankAccountHolder] = useState(user?.payoutDetails?.bankAccountHolder ?? "");
  const [kycDocuments, setKycDocuments] = useState<{ url: string; name: string }[]>([]);

  // Investor
  const [focusInput, setFocusInput] = useState(user?.investmentFocus?.join(", ") ?? "");
  const [ticketSizeMin, setTicketSizeMin] = useState(user?.ticketSizeMin ?? 0);
  const [ticketSizeMax, setTicketSizeMax] = useState(user?.ticketSizeMax ?? 0);
  const [portfolioCompanyCount, setPortfolioCompanyCount] = useState(user?.portfolioCompanyCount ?? 0);

  // Mentor
  const [expertiseInput, setExpertiseInput] = useState(user?.expertise?.join(", ") ?? "");
  const [sessionRate, setSessionRate] = useState(user?.sessionRate ?? 0);

  // Partner
  const [organizationName, setOrganizationName] = useState(user?.organizationName ?? "");
  const [partnerType, setPartnerType] = useState<PartnerType>(user?.partnerType ?? "service_provider");

  // Client
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");

  // Founder
  const [linkedIn, setLinkedIn] = useState(user?.linkedIn ?? "");
  const [industriesInput, setIndustriesInput] = useState(user?.industries?.join(", ") ?? "");
  const [pastStartupsCount, setPastStartupsCount] = useState(user?.pastStartupsCount ?? 0);
  const [experience, setExperience] = useState<ExperienceEntry[]>(user?.experience ?? []);
  const [education, setEducation] = useState<EducationEntry[]>(user?.education ?? []);
  const [achievements, setAchievements] = useState<AchievementEntry[]>(user?.achievements ?? []);
  const [languagesInput, setLanguagesInput] = useState(user?.languages?.join(", ") ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "");
  const [nationality, setNationality] = useState(user?.nationality ?? "");
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel ?? "");
  const [roleTagsInput, setRoleTagsInput] = useState(user?.roleTags?.join(", ") ?? "");
  const [lookingForInput, setLookingForInput] = useState(user?.lookingFor?.join(", ") ?? "");
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter ?? "");
  const [github, setGithub] = useState(user?.socialLinks?.github ?? "");
  const [website, setWebsite] = useState(user?.socialLinks?.website ?? "");

  const updateExperience = (index: number, patch: Partial<ExperienceEntry>) => {
    setExperience((prev) => prev.map((exp, i) => (i === index ? { ...exp, ...patch } : exp)));
  };
  const addExperience = () => setExperience((prev) => [...prev, { ...EMPTY_EXPERIENCE }]);
  const removeExperience = (index: number) => setExperience((prev) => prev.filter((_, i) => i !== index));

  const updateEducation = (index: number, patch: Partial<EducationEntry>) => {
    setEducation((prev) => prev.map((edu, i) => (i === index ? { ...edu, ...patch } : edu)));
  };
  const addEducation = () => setEducation((prev) => [...prev, { ...EMPTY_EDUCATION }]);
  const removeEducation = (index: number) => setEducation((prev) => prev.filter((_, i) => i !== index));

  const updateAchievement = (index: number, patch: Partial<AchievementEntry>) => {
    setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };
  const addAchievement = () => setAchievements((prev) => [...prev, { ...EMPTY_ACHIEVEMENT }]);
  const removeAchievement = (index: number) => setAchievements((prev) => prev.filter((_, i) => i !== index));

  const updatePortfolioItem = (index: number, patch: Partial<PortfolioItem>) => {
    setPortfolioItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const addPortfolioItem = () => setPortfolioItems((prev) => [...prev, { ...EMPTY_PORTFOLIO_ITEM }]);
  const removePortfolioItem = (index: number) => setPortfolioItems((prev) => prev.filter((_, i) => i !== index));
  const portfolioItemTags = (index: number) => portfolioItems[index]?.tags?.join(", ") ?? "";
  const portfolioItemVerifiedPaymentId = (item: PortfolioItem) =>
    typeof item.verifiedPayment === "string" ? item.verifiedPayment : (item.verifiedPayment?._id ?? "");

  // Only real, released payments the freelancer actually received can back a
  // "Verified" badge — the backend re-checks this ownership on save too.
  const { data: completedPayments } = useQuery({
    queryKey: ["payments", "earnings", "verifiable"],
    queryFn: () => paymentApi.myEarnings({ limit: 200 }),
    enabled: user?.role === "freelancer",
  });
  const verifiablePayments = (completedPayments?.payments ?? []).filter((p) => p.escrowStatus === "released");

  // Completed work not yet turned into a portfolio item — shown as one-click
  // suggestions above the manual list so freelancers don't have to retype
  // details that already exist on the payment (title, client, delivered image).
  const linkedPaymentIds = new Set(portfolioItems.map((item) => portfolioItemVerifiedPaymentId(item)).filter(Boolean));
  const suggestedPayments = verifiablePayments.filter((p) => !linkedPaymentIds.has(p._id));

  const addPortfolioItemFromPayment = (payment: (typeof verifiablePayments)[number]) => {
    const payerName = typeof payment.payer === "object" ? payment.payer.name : "";
    const image = payment.deliverables?.find((d) => /\.(png|jpe?g|gif|webp|svg)$/i.test(d.url))?.url ?? "";
    setPortfolioItems((prev) => [
      ...prev,
      {
        ...EMPTY_PORTFOLIO_ITEM,
        title: payment.note || "",
        description: payment.deliveryNote || "",
        image,
        clientName: payerName,
        verifiedPayment: payment._id,
      },
    ]);
  };

  const mutation = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        avatar,
        coverImage,
        headline,
        location: [city, state, country].filter(Boolean).join(", "),
        bio,
        category,
        subCategory,
        skills: splitList(skillsInput),
        hourlyRate,
        yearsOfExperience,
        availabilityStatus,
        workingDays,
        workingHours,
        responseTimeLabel,
        phone,
        resumeUrl,
        videoIntro,
        portfolioItems,
        payoutDetails: {
          preferredMethod: payoutMethod,
          upiId: payoutUpiId,
          bankAccountNumber: payoutBankAccountNumber,
          bankIfsc: payoutBankIfsc,
          bankAccountHolder: payoutBankAccountHolder,
        },
        investmentFocus: splitList(focusInput),
        ticketSizeMin,
        ticketSizeMax,
        portfolioCompanyCount,
        expertise: splitList(expertiseInput),
        sessionRate,
        organizationName,
        partnerType,
        companyName,
        linkedIn,
        industries: splitList(industriesInput),
        pastStartupsCount,
        experience: experience.filter((exp) => exp.title.trim() && exp.company.trim()),
        education: education.filter((edu) => edu.degree.trim() && edu.institution.trim()),
        achievements: achievements.filter((a) => a.title.trim()),
        languages: splitList(languagesInput),
        dateOfBirth: dateOfBirth || undefined,
        nationality,
        educationLevel,
        roleTags: splitList(roleTagsInput),
        lookingFor: splitList(lookingForInput),
        socialLinks: { twitter, github, website },
      }),
    onSuccess: () => refreshUser(),
  });

  const kycMutation = useMutation({
    mutationFn: () => userApi.submitKyc(kycDocuments),
    onSuccess: () => {
      refreshUser();
      setKycDocuments([]);
    },
  });

  if (!user) return null;

  return (
    <DashboardLayout
      role={sidebarRole}
      title="Edit Profile"
      subtitle="Keep your profile up to date to get better matches."
      actions={
        user.role === "founder" ? (
          <Button variant="outline" asChild>
            <Link to={`/founders/${user.id}`}>
              <ExternalLink className="h-4 w-4" /> View Public Profile
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <FormGuidelines
          tips={[
            "Keep your headline and bio clear and concise",
            "Use simple, professional language",
            "Add accurate and honest information",
            "A complete profile builds trust and gets more matches",
          ]}
        />
        <Card>
          <CardContent className="space-y-5 p-6">
            <h3 className="text-base font-semibold">Basic Info</h3>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage src={avatar} alt={user.name} />
                <AvatarFallback className="text-lg">{initialsFromName(user.name)}</AvatarFallback>
              </Avatar>
              <div className="max-w-xs flex-1 space-y-1">
                <FileUpload folder="avatar" value={avatar} onUploaded={(url) => setAvatar(url)} label="Upload profile photo" />
                <p className="text-[11px] text-muted-foreground">Recommended: 400 × 400px (square), JPG/PNG/WebP, max 10MB.</p>
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel info="A banner image at the top of your profile (optional).">Cover Photo</FieldLabel>
              {coverImage && (
                <img src={coverImage} alt="Cover preview" className="h-24 w-full rounded-lg object-cover" />
              )}
              <div className="max-w-xs space-y-1">
                <FileUpload folder="profile_cover" value={coverImage} onUploaded={(url) => setCoverImage(url)} label="Upload cover photo" />
                <p className="text-[11px] text-muted-foreground">Recommended: 1200 × 300px (4:1 ratio), JPG/PNG/WebP, max 10MB.</p>
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="headline" info="A short line about who you are, shown under your name.">
                Headline
              </FieldLabel>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Product Designer, Ex-Google" />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
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
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself..." />
            </div>
          </CardContent>
        </Card>

        {user.role === "founder" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-base font-semibold">Founder Details</h3>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
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
                <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Product Strategy, Fundraising, Leadership" />
              </div>
              <div className="space-y-2">
                <Label>Role Tags (comma separated)</Label>
                <Input value={roleTagsInput} onChange={(e) => setRoleTagsInput(e.target.value)} placeholder="Entrepreneur, Leader, Problem Solver" />
              </div>
              <div className="space-y-2">
                <Label>Looking For (comma separated)</Label>
                <Input value={lookingForInput} onChange={(e) => setLookingForInput(e.target.value)} placeholder="Co-Founder, Investor, Mentor, Advisor" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
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
        )}

        {user.role === "founder" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-base font-semibold">Personal Info</h3>
              <div className="grid gap-5 sm:grid-cols-2">
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
        )}

        {(user.role === "founder" || user.role === "freelancer") && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Experience Timeline</h3>
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
        )}

        {(user.role === "founder" || user.role === "freelancer") && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Education</h3>
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
        )}

        {(user.role === "founder" || user.role === "freelancer") && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{user.role === "freelancer" ? "Certificates" : "Achievements"}</h3>
                <Button variant="outline" size="sm" onClick={addAchievement}>
                  <Plus className="h-3.5 w-3.5" /> Add {user.role === "freelancer" ? "Certificate" : "Achievement"}
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
        )}

        {user.role === "freelancer" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Freelancer Details</h3>
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
              <div className="grid gap-5 sm:grid-cols-2">
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
                  {category && SERVICE_CATEGORIES[category]?.length ? (
                    <Select value={subCategory} onValueChange={setSubCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES[category].map((sub) => (
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
                <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, Node.js, UI Design" />
              </div>
              <div className="space-y-2">
                <FieldLabel info="Languages you can communicate in — shown on your profile so clients know before reaching out.">
                  Languages (comma separated)
                </FieldLabel>
                <Input value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} placeholder="English, Marathi, Hindi" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
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
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <FieldLabel info="Your account's email — filled in automatically, not editable here.">Email ID</FieldLabel>
                  <Input value={user?.email ?? ""} disabled />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Working hours and response time are self-reported and shown as-is on your public profile.</p>
            </CardContent>
          </Card>
        )}

        {user.role === "freelancer" && (
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-base font-semibold">Resume</h3>
              <p className="text-xs text-muted-foreground">Upload a PDF resume for clients to view on your profile.</p>
              <FileUpload
                folder="resume"
                accept="application/pdf"
                value={resumeUrl}
                onUploaded={(url) => setResumeUrl(url)}
                label="Click to upload your resume (PDF)"
              />
            </CardContent>
          </Card>
        )}

        {user.role === "freelancer" && (
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-base font-semibold">Video Introduction</h3>
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
        )}

        {user.role === "freelancer" && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Portfolio</h3>
                  <p className="text-xs text-muted-foreground">Showcase past work so clients can see proof before they hire you.</p>
                </div>
                <Button variant="outline" size="sm" onClick={addPortfolioItem}>
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              {suggestedPayments.length > 0 && (
                <div className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Add from your completed work
                  </p>
                  <div className="space-y-2">
                    {suggestedPayments.map((p) => (
                      <div key={p._id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.note || TYPE_LABELS[p.type]}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(p.netAmount || p.amount)} · {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => addPortfolioItemFromPayment(p)}>
                          <Plus className="h-3.5 w-3.5" /> Add to Portfolio
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {portfolioItems.length === 0 && <p className="text-sm text-muted-foreground">No portfolio items added yet.</p>}

              {portfolioItems.map((item, i) => (
                <div key={i} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Item {i + 1}</span>
                    <button type="button" onClick={() => removePortfolioItem(i)} className="text-danger hover:opacity-80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-28 w-full rounded-lg object-cover sm:w-[140px]" />
                    ) : (
                      <FileUpload
                        folder="service_cover"
                        value={item.image}
                        onUploaded={(url) => updatePortfolioItem(i, { image: url })}
                        label="Upload image"
                        className="h-28 sm:w-[140px]"
                      />
                    )}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input value={item.title} onChange={(e) => updatePortfolioItem(i, { title: e.target.value })} placeholder="E-commerce Website Redesign" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updatePortfolioItem(i, { description: e.target.value })}
                          placeholder="What did you build, and what was the outcome?"
                          className="min-h-[70px]"
                        />
                      </div>
                    </div>
                  </div>
                  {item.image && (
                    <button type="button" onClick={() => updatePortfolioItem(i, { image: "" })} className="text-xs text-danger hover:underline">
                      Remove image
                    </button>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Client (optional)</Label>
                      <Input value={item.clientName ?? ""} onChange={(e) => updatePortfolioItem(i, { clientName: e.target.value })} placeholder="Acme Pvt Ltd" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Your Role (optional)</Label>
                      <Input value={item.projectRole ?? ""} onChange={(e) => updatePortfolioItem(i, { projectRole: e.target.value })} placeholder="Lead Frontend Developer" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={portfolioItemTags(i)}
                      onChange={(e) => updatePortfolioItem(i, { tags: splitList(e.target.value) })}
                      placeholder="React, Shopify, UI Design"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Link (optional)</Label>
                    <Input value={item.link} onChange={(e) => updatePortfolioItem(i, { link: e.target.value })} placeholder="https://..." />
                  </div>
                  {verifiablePayments.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1">
                        <BadgeCheck className="h-3.5 w-3.5 text-success" /> Link to a completed payment (shows a Verified badge)
                      </Label>
                      <Select
                        value={portfolioItemVerifiedPaymentId(item) || "none"}
                        onValueChange={(v) => updatePortfolioItem(i, { verifiedPayment: v === "none" ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Not linked" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not linked</SelectItem>
                          {verifiablePayments.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {TYPE_LABELS[p.type]} · {formatCurrency(p.netAmount || p.amount)} · {new Date(p.createdAt).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {user.role === "freelancer" && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-base font-semibold">Payout Details</h3>
                <p className="text-xs text-muted-foreground">Save your UPI ID or bank details so you don&apos;t need to re-enter them every time you withdraw.</p>
              </div>
              <div className="space-y-2">
                <Label>Preferred Method</Label>
                <Select value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as WithdrawalMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {payoutMethod === "upi" ? (
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input value={payoutUpiId} onChange={(e) => setPayoutUpiId(e.target.value)} placeholder="yourname@upi" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input value={payoutBankAccountHolder} onChange={(e) => setPayoutBankAccountHolder(e.target.value)} placeholder="As per bank records" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input value={payoutBankAccountNumber} onChange={(e) => setPayoutBankAccountNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code</Label>
                      <Input value={payoutBankIfsc} onChange={(e) => setPayoutBankIfsc(e.target.value.toUpperCase())} placeholder="ABCD0123456" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {user.role === "freelancer" && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Identity Verification (KYC)</h3>
                  <p className="text-xs text-muted-foreground">Required before you can withdraw your earnings.</p>
                </div>
                {user.kycStatus === "verified" && (
                  <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
                {user.kycStatus === "pending" && (
                  <span className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                    <Clock className="h-3.5 w-3.5" /> Under Review
                  </span>
                )}
                {(user.kycStatus === "unverified" || !user.kycStatus) && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" /> Not Verified
                  </span>
                )}
                {user.kycStatus === "rejected" && (
                  <span className="flex items-center gap-1 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
                    <ShieldAlert className="h-3.5 w-3.5" /> Rejected
                  </span>
                )}
              </div>

              {user.kycStatus === "rejected" && user.kycReviewNote && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">Reason: {user.kycReviewNote}</p>
              )}

              {(user.kycStatus === "unverified" || user.kycStatus === "rejected" || !user.kycStatus) && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Upload a government-issued ID (Aadhaar, PAN, passport, or driving licence) as an image or PDF.
                  </p>
                  <div className="space-y-2">
                    {kycDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                        <button type="button" onClick={() => setKycDocuments((prev) => prev.filter((_, idx) => idx !== i))}>
                          <X className="h-3.5 w-3.5 text-danger" />
                        </button>
                      </div>
                    ))}
                    <FileUpload
                      folder="document"
                      accept="image/png,image/jpeg,application/pdf"
                      label="Upload ID document"
                      onUploaded={(url, fileName) => setKycDocuments((prev) => [...prev, { url, name: fileName }])}
                    />
                  </div>
                  {kycMutation.isError && (
                    <p className="text-xs text-danger">
                      {isAxiosError(kycMutation.error) ? kycMutation.error.response?.data?.message : "Something went wrong."}
                    </p>
                  )}
                  {kycMutation.isSuccess && <p className="text-xs text-success">Submitted for review.</p>}
                  <Button
                    type="button"
                    variant="gradient"
                    size="sm"
                    disabled={kycDocuments.length === 0 || kycMutation.isPending}
                    onClick={() => kycMutation.mutate()}
                  >
                    {kycMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Submit for Verification
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {user.role === "investor" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-base font-semibold">Investor Details</h3>
              <div className="space-y-2">
                <Label>Investment Focus (comma separated)</Label>
                <Input value={focusInput} onChange={(e) => setFocusInput(e.target.value)} placeholder="SaaS, FinTech, AI" />
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Min Ticket Size (₹)</Label>
                  <Input type="number" min={0} value={ticketSizeMin} onChange={(e) => setTicketSizeMin(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Ticket Size (₹)</Label>
                  <Input type="number" min={0} value={ticketSizeMax} onChange={(e) => setTicketSizeMax(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Portfolio Companies</Label>
                  <Input type="number" min={0} value={portfolioCompanyCount} onChange={(e) => setPortfolioCompanyCount(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user.role === "mentor" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-base font-semibold">Mentor Details</h3>
              <div className="space-y-2">
                <Label>Areas of Expertise (comma separated)</Label>
                <Input value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} placeholder="Fundraising, Growth, Product" />
              </div>
              <div className="space-y-2 sm:max-w-xs">
                <Label>Session Rate (₹, 0 for free)</Label>
                <Input type="number" min={0} value={sessionRate} onChange={(e) => setSessionRate(Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>
        )}

        {user.role === "partner" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-base font-semibold">Partner Details</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your organization" />
                </div>
                <div className="space-y-2">
                  <Label>Partner Type</Label>
                  <Select value={partnerType} onValueChange={(v) => setPartnerType(v as PartnerType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user.role === "client" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-base font-semibold">Company Details</h3>
              <div className="space-y-2 sm:max-w-sm">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
              </div>
            </CardContent>
          </Card>
        )}

        {mutation.isSuccess && <p className="text-sm font-medium text-success">Profile updated successfully.</p>}
        {mutation.isError && <p className="text-sm text-danger">Something went wrong while saving your profile.</p>}

        <div className="flex justify-end">
          <Button variant="gradient" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function splitList(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
