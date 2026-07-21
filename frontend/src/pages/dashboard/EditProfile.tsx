import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/shared/FileUpload";
import { userApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName } from "@/lib/utils";
import type { PartnerType, ExperienceEntry, EducationEntry, AchievementEntry, PortfolioItem } from "@/types";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/lib/geo";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";

const EMPTY_EXPERIENCE: ExperienceEntry = { title: "", company: "", location: "", startLabel: "", endLabel: "Present", description: "" };
const EMPTY_EDUCATION: EducationEntry = { degree: "", institution: "", startLabel: "", endLabel: "" };
const EMPTY_ACHIEVEMENT: AchievementEntry = { title: "", description: "", dateLabel: "" };
const EMPTY_PORTFOLIO_ITEM: PortfolioItem = { title: "", description: "", image: "", link: "" };

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
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(user?.portfolioItems ?? []);

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
        portfolioItems,
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
              <Label>Cover Photo</Label>
              {coverImage && (
                <img src={coverImage} alt="Cover preview" className="h-24 w-full rounded-lg object-cover" />
              )}
              <div className="max-w-xs space-y-1">
                <FileUpload folder="profile_cover" value={coverImage} onUploaded={(url) => setCoverImage(url)} label="Upload cover photo" />
                <p className="text-[11px] text-muted-foreground">Recommended: 1200 × 300px (4:1 ratio), JPG/PNG/WebP, max 10MB.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Product Designer, Ex-Google" />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Country</Label>
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
                <Label>State</Label>
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
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
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

        {user.role === "founder" && (
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

        {user.role === "founder" && (
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

        {user.role === "founder" && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Achievements</h3>
                <Button variant="outline" size="sm" onClick={addAchievement}>
                  <Plus className="h-3.5 w-3.5" /> Add Achievement
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
              <h3 className="text-base font-semibold">Freelancer Details</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
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
                  <Label>Sub-Category</Label>
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
                <Label>Skills (comma separated)</Label>
                <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, Node.js, UI Design" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Hourly Rate (₹)</Label>
                  <Input type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input type="number" min={0} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(Number(e.target.value))} />
                </div>
              </div>
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
                  <div className="space-y-1.5">
                    <Label>Link (optional)</Label>
                    <Input value={item.link} onChange={(e) => updatePortfolioItem(i, { link: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              ))}
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
