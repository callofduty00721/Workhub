import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ExternalLink, ArrowLeft, User, Briefcase, Image, Wallet, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { resolveDashboardRole } from "@/components/layout/DashboardSidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FormGuidelines } from "@/components/shared/FormGuidelines";
import { userApi } from "@/api/users";
import { authApi } from "@/api/auth";
import { paymentApi } from "@/api/payments";
import { useAuth } from "@/context/AuthContext";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { domToBioText, renderBioHtml } from "@/lib/richText";
import type {
  PartnerType,
  ExperienceEntry,
  EducationEntry,
  AchievementEntry,
  PortfolioItem,
  WithdrawalMethod,
  AvailabilityStatus,
  FounderStage,
  InfluencerPlatform,
  InfluencerRate,
  InfluencerCollaboration,
  InfluencerContentSample,
  InfluencerLanguage,
  BrandProduct,
  InfluencerRequirement,
  AgencyService,
  PartnerClient,
  ProfileSocialLink,
  StartupStage,
  MentorSessionFormat,
  CompanySize,
} from "@/types";
import { dashboardPathForRole, publicProfilePathForRole } from "@/lib/roles";
import { motion } from "framer-motion";
import { to24Hour, splitList } from "@/pages/dashboard/edit-profile/shared";
import { BasicInfoSection } from "@/pages/dashboard/edit-profile/BasicInfoSection";
import { FounderDetailsSection } from "@/pages/dashboard/edit-profile/FounderDetailsSection";
import { PersonalInfoSection } from "@/pages/dashboard/edit-profile/PersonalInfoSection";
import { ExperienceEducationSection } from "@/pages/dashboard/edit-profile/ExperienceEducationSection";
import { FreelancerDetailsSection } from "@/pages/dashboard/edit-profile/FreelancerDetailsSection";
import { PortfolioSection } from "@/pages/dashboard/edit-profile/PortfolioSection";
import { PayoutKycSection } from "@/pages/dashboard/edit-profile/PayoutKycSection";
import { InvestorDetailsSection } from "@/pages/dashboard/edit-profile/InvestorDetailsSection";
import { MentorDetailsSection } from "@/pages/dashboard/edit-profile/MentorDetailsSection";
import { PartnerDetailsSection } from "@/pages/dashboard/edit-profile/PartnerDetailsSection";
import { CompanyDetailsSection } from "@/pages/dashboard/edit-profile/CompanyDetailsSection";
import { JobSeekerDetailsSection } from "@/pages/dashboard/edit-profile/JobSeekerDetailsSection";
import { InfluencerDetailsSection } from "@/pages/dashboard/edit-profile/InfluencerDetailsSection";
import { BrandDetailsSection } from "@/pages/dashboard/edit-profile/BrandDetailsSection";
import { AgencyDetailsSection } from "@/pages/dashboard/edit-profile/AgencyDetailsSection";
import { TalentPartnerDetailsSection } from "@/pages/dashboard/edit-profile/TalentPartnerDetailsSection";

const EMPTY_EXPERIENCE: ExperienceEntry = { title: "", company: "", location: "", startLabel: "", endLabel: "Present", description: "" };
const EMPTY_EDUCATION: EducationEntry = { degree: "", institution: "", startLabel: "", endLabel: "" };
const EMPTY_ACHIEVEMENT: AchievementEntry = { title: "", description: "", dateLabel: "" };
const EMPTY_PORTFOLIO_ITEM: PortfolioItem = {
  title: "",
  description: "",
  images: [],
  video: "",
  pdf: "",
  websiteLink: "",
  githubLink: "",
  liveDemoLink: "",
  tags: [],
  clientName: "",
  projectRole: "",
};

// The freelancer form is long enough (Basic Info, Professional Details,
// Portfolio, Payout & Verification) that showing it all on one scrolling
// page felt overwhelming — split into tabs for that role only. Sidebar
// anchors (#skills, #portfolio, #kyc) still work: they just pick the tab
// that contains that section instead of scrolling to it directly.
type FreelancerTab = "basic" | "professional" | "portfolio" | "payout";

function hashToFreelancerTab(hash: string): FreelancerTab {
  if (hash === "#portfolio") return "portfolio";
  if (hash === "#kyc") return "payout";
  if (hash === "#skills") return "professional";
  return "basic";
}

const FREELANCER_TAB_ORDER: FreelancerTab[] = ["basic", "professional", "portfolio", "payout"];

function nextFreelancerTab(tab: FreelancerTab): FreelancerTab {
  const i = FREELANCER_TAB_ORDER.indexOf(tab);
  return FREELANCER_TAB_ORDER[Math.min(i + 1, FREELANCER_TAB_ORDER.length - 1)];
}

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const sidebarRole = resolveDashboardRole(user?.role);
  useScrollToHash();

  const location = useLocation();
  const [activeTab, setActiveTab] = useState<FreelancerTab>(() => hashToFreelancerTab(location.hash));
  useEffect(() => {
    setActiveTab(hashToFreelancerTab(location.hash));
  }, [location.hash]);
  // Only freelancer sees the tabbed layout below — every other role keeps
  // rendering its cards inline, so this always resolves true for them.
  const showForFreelancerTab = (tab: FreelancerTab) => user?.role !== "freelancer" || activeTab === tab;

  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [coverImage, setCoverImage] = useState(user?.coverImage ?? "");
  const [headline, setHeadline] = useState(user?.headline ?? "");
  const locationParts = (user?.location ?? "").split(",").map((s) => s.trim());
  const [city, setCity] = useState(locationParts[0] ?? "");
  const [state, setState] = useState(locationParts[1] ?? "");
  const [country, setCountry] = useState(locationParts[2] || "India");
  const [bio, setBio] = useState(user?.bio ?? "");
  const bioRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Sets the contentEditable box's starting content exactly once. React must
    // never touch its children again after this — re-supplying HTML on every
    // keystroke's re-render (e.g. via dangerouslySetInnerHTML in the JSX) wipes
    // whatever the user just typed, since React reconciles it back to the same
    // "initial" value on every render.
    if (bioRef.current) bioRef.current.innerHTML = renderBioHtml(user?.bio ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const syncBioFromDom = () => {
    if (bioRef.current) setBio(domToBioText(bioRef.current));
  };
  const applyBioMarker = (command: "bold" | "italic") => {
    const el = bioRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command);
    syncBioFromDom();
  };

  // Freelancer
  const [category, setCategory] = useState(user?.category ?? "");
  const [subCategory, setSubCategory] = useState(user?.subCategory ?? "");
  const [skillsInput, setSkillsInput] = useState(user?.skills?.join(", ") ?? "");
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate ?? 0);
  const [yearsOfExperience, setYearsOfExperience] = useState(user?.yearsOfExperience ?? 0);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(user?.availabilityStatus ?? "available");
  const [workingDays, setWorkingDays] = useState<string[]>(user?.workingDays ?? []);
  const [hoursPerWeekAvailable, setHoursPerWeekAvailable] = useState(user?.hoursPerWeekAvailable ?? 0);
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
  const [faceSelfie, setFaceSelfie] = useState("");
  const [bankVerificationDocuments, setBankVerificationDocuments] = useState<{ url: string; name: string }[]>([]);

  // Investor
  const [focusInput, setFocusInput] = useState(user?.investmentFocus?.join(", ") ?? "");
  const [ticketSizeMin, setTicketSizeMin] = useState(user?.ticketSizeMin ?? 0);
  const [ticketSizeMax, setTicketSizeMax] = useState(user?.ticketSizeMax ?? 0);
  const [portfolioCompanyCount, setPortfolioCompanyCount] = useState(user?.portfolioCompanyCount ?? 0);
  const [fundName, setFundName] = useState(user?.fundName ?? "");
  const [fundSize, setFundSize] = useState(user?.fundSize ?? 0);
  const [preferredStages, setPreferredStages] = useState<StartupStage[]>(user?.preferredStages ?? []);

  // Mentor — availability reuses the freelancer working-hours state below
  // (hoursPerWeekAvailable/workingDays/workingHours), same underlying fields.
  const [expertiseInput, setExpertiseInput] = useState(user?.expertise?.join(", ") ?? "");
  const [sessionRate, setSessionRate] = useState(user?.sessionRate ?? 0);
  const [sessionFormat, setSessionFormat] = useState<MentorSessionFormat>(user?.sessionFormat ?? "video");

  // Partner
  const [organizationName, setOrganizationName] = useState(user?.organizationName ?? "");
  const [partnerType, setPartnerType] = useState<PartnerType>(user?.partnerType ?? "service_provider");
  const [programDetails, setProgramDetails] = useState(user?.programDetails ?? "");
  const [startupsSupportedCount, setStartupsSupportedCount] = useState(user?.startupsSupportedCount ?? 0);
  const [applicationLink, setApplicationLink] = useState(user?.applicationLink ?? "");

  // Client
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [companySize, setCompanySize] = useState<CompanySize>(user?.companySize ?? "");
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState(user?.companyRegistrationNumber ?? "");

  // Job Seeker
  const [desiredRole, setDesiredRole] = useState(user?.jobSeekerProfile?.desiredRole ?? "");
  const [expectedSalary, setExpectedSalary] = useState(user?.jobSeekerProfile?.expectedSalary ?? 0);
  const [noticePeriodDays, setNoticePeriodDays] = useState(user?.jobSeekerProfile?.noticePeriodDays ?? 0);
  const [preferredLocationsInput, setPreferredLocationsInput] = useState(user?.jobSeekerProfile?.preferredLocations?.join(", ") ?? "");
  const [willingToRelocate, setWillingToRelocate] = useState(user?.jobSeekerProfile?.willingToRelocate ?? false);

  // Influencer
  const [influencerCategory, setInfluencerCategory] = useState(user?.influencerProfile?.category ?? "");
  const [niche, setNiche] = useState(user?.influencerProfile?.niche ?? "");
  const [mediaKitUrl, setMediaKitUrl] = useState(user?.influencerProfile?.mediaKitUrl ?? "");
  const [platforms, setPlatforms] = useState<InfluencerPlatform[]>(user?.influencerProfile?.platforms ?? []);
  const [rateCard, setRateCard] = useState<InfluencerRate[]>(user?.influencerProfile?.rateCard ?? []);
  const [pastCollaborations, setPastCollaborations] = useState<InfluencerCollaboration[]>(user?.influencerProfile?.pastCollaborations ?? []);
  const [contentSamples, setContentSamples] = useState<InfluencerContentSample[]>(user?.influencerProfile?.contentSamples ?? []);
  const [languages, setLanguages] = useState<InfluencerLanguage[]>(user?.influencerProfile?.languages ?? []);

  // Brand
  const [brandIndustry, setBrandIndustry] = useState(user?.brandProfile?.industry ?? "");
  const [brandCategories, setBrandCategories] = useState<string[]>(user?.brandProfile?.categories ?? []);
  const [brandWebsite, setBrandWebsite] = useState(user?.brandProfile?.website ?? "");
  const [brandSocialLinks, setBrandSocialLinks] = useState<ProfileSocialLink[]>(user?.brandProfile?.socialLinks ?? []);
  const [brandFollowerCount, setBrandFollowerCount] = useState(user?.brandProfile?.followerCount ?? 0);
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>(user?.brandProfile?.products ?? []);
  const [brandRequirements, setBrandRequirements] = useState<InfluencerRequirement[]>(user?.brandProfile?.influencerRequirements ?? []);
  const [brandPastCollaborations, setBrandPastCollaborations] = useState<InfluencerCollaboration[]>(user?.brandProfile?.pastCollaborations ?? []);

  const updateBrandProduct = (index: number, patch: Partial<BrandProduct>) => {
    setBrandProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };
  const addBrandProduct = () => setBrandProducts((prev) => [...prev, { name: "", description: "", imageUrl: "" }]);
  const removeBrandProduct = (index: number) => setBrandProducts((prev) => prev.filter((_, i) => i !== index));

  const updateBrandRequirement = (index: number, patch: Partial<InfluencerRequirement>) => {
    setBrandRequirements((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const addBrandRequirement = () => setBrandRequirements((prev) => [...prev, { category: "", minFollowers: 0, platforms: [], location: "", notes: "" }]);
  const removeBrandRequirement = (index: number) => setBrandRequirements((prev) => prev.filter((_, i) => i !== index));

  const updateBrandCollaboration = (index: number, patch: Partial<InfluencerCollaboration>) => {
    setBrandPastCollaborations((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const addBrandCollaboration = () => setBrandPastCollaborations((prev) => [...prev, { brandName: "", description: "", resultMetric: "" }]);
  const removeBrandCollaboration = (index: number) => setBrandPastCollaborations((prev) => prev.filter((_, i) => i !== index));

  // Agency
  const [agencyType, setAgencyType] = useState(user?.agencyProfile?.agencyType ?? "");
  const [agencyWebsite, setAgencyWebsite] = useState(user?.agencyProfile?.website ?? "");
  const [agencySocialLinks, setAgencySocialLinks] = useState<ProfileSocialLink[]>(user?.agencyProfile?.socialLinks ?? []);
  const [agencyTeamSize, setAgencyTeamSize] = useState(user?.agencyProfile?.teamSize ?? 0);
  const [agencyServices, setAgencyServices] = useState<AgencyService[]>(user?.agencyProfile?.services ?? []);
  const [agencyClients, setAgencyClients] = useState<PartnerClient[]>(user?.agencyProfile?.clients ?? []);
  const [agencyPastCampaigns, setAgencyPastCampaigns] = useState<InfluencerCollaboration[]>(user?.agencyProfile?.pastCampaigns ?? []);

  const updateAgencyClient = (index: number, patch: Partial<PartnerClient>) => {
    setAgencyClients((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const addAgencyClient = () => setAgencyClients((prev) => [...prev, { clientName: "", logoUrl: "", description: "" }]);
  const removeAgencyClient = (index: number) => setAgencyClients((prev) => prev.filter((_, i) => i !== index));

  const updateAgencyPastCampaign = (index: number, patch: Partial<InfluencerCollaboration>) => {
    setAgencyPastCampaigns((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const addAgencyPastCampaign = () => setAgencyPastCampaigns((prev) => [...prev, { brandName: "", description: "", resultMetric: "" }]);
  const removeAgencyPastCampaign = (index: number) => setAgencyPastCampaigns((prev) => prev.filter((_, i) => i !== index));

  // Talent Partner
  const [talentPartnerType, setTalentPartnerType] = useState(user?.talentPartnerProfile?.partnerType ?? "");
  const [talentPartnerWebsite, setTalentPartnerWebsite] = useState(user?.talentPartnerProfile?.website ?? "");
  const [talentPartnerSocialLinks, setTalentPartnerSocialLinks] = useState<ProfileSocialLink[]>(user?.talentPartnerProfile?.socialLinks ?? []);
  const [talentPartnerServicesInput, setTalentPartnerServicesInput] = useState(user?.talentPartnerProfile?.services?.join(", ") ?? "");
  const [talentPartnerBrandPartnerships, setTalentPartnerBrandPartnerships] = useState<PartnerClient[]>(
    user?.talentPartnerProfile?.brandPartnerships ?? []
  );

  const updateTalentPartnership = (index: number, patch: Partial<PartnerClient>) => {
    setTalentPartnerBrandPartnerships((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const addTalentPartnership = () => setTalentPartnerBrandPartnerships((prev) => [...prev, { clientName: "", logoUrl: "", description: "" }]);
  const removeTalentPartnership = (index: number) => setTalentPartnerBrandPartnerships((prev) => prev.filter((_, i) => i !== index));

  // Founder — verification stage (see backend/src/utils/roleCategories.js:
  // idea-stage founders can freely look for co-founders/team, but paid job
  // posts and investor pitches need isVerified regardless of stage)
  const [founderStage, setFounderStage] = useState<FounderStage>(user?.founderStage ?? "idea");

  const updatePlatform = (index: number, patch: Partial<InfluencerPlatform>) => {
    setPlatforms((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };
  const addPlatform = () => setPlatforms((prev) => [...prev, { platform: "", handle: "", followers: 0, url: "" }]);
  const removePlatform = (index: number) => setPlatforms((prev) => prev.filter((_, i) => i !== index));

  const updateRateCardItem = (index: number, patch: Partial<InfluencerRate>) => {
    setRateCard((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const addRateCardItem = () => setRateCard((prev) => [...prev, { platform: "", contentType: "", priceInInr: 0 }]);
  const removeRateCardItem = (index: number) => setRateCard((prev) => prev.filter((_, i) => i !== index));

  const updateCollaboration = (index: number, patch: Partial<InfluencerCollaboration>) => {
    setPastCollaborations((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const addCollaboration = () => setPastCollaborations((prev) => [...prev, { brandName: "", description: "", resultMetric: "" }]);
  const removeCollaboration = (index: number) => setPastCollaborations((prev) => prev.filter((_, i) => i !== index));

  const updateContentSample = (index: number, patch: Partial<InfluencerContentSample>) => {
    setContentSamples((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const addContentSample = () => setContentSamples((prev) => [...prev, { url: "", caption: "" }]);
  const removeContentSample = (index: number) => setContentSamples((prev) => prev.filter((_, i) => i !== index));

  const updateLanguage = (index: number, patch: Partial<InfluencerLanguage>) => {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };
  const addLanguage = () => setLanguages((prev) => [...prev, { name: "", level: "fluent" }]);
  const removeLanguage = (index: number) => setLanguages((prev) => prev.filter((_, i) => i !== index));

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
        hoursPerWeekAvailable,
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
        fundName,
        fundSize,
        preferredStages,
        expertise: splitList(expertiseInput),
        sessionRate,
        sessionFormat,
        organizationName,
        partnerType,
        programDetails,
        startupsSupportedCount,
        applicationLink,
        companyName,
        companySize,
        companyRegistrationNumber,
        jobSeekerProfile: {
          desiredRole,
          expectedSalary,
          noticePeriodDays,
          preferredLocations: splitList(preferredLocationsInput),
          willingToRelocate,
        },
        influencerProfile: {
          category: influencerCategory,
          niche,
          mediaKitUrl,
          platforms: platforms.filter((p) => p.platform.trim()),
          rateCard: rateCard.filter((r) => r.platform.trim() && r.contentType.trim()),
          pastCollaborations: pastCollaborations.filter((c) => c.brandName.trim()),
          contentSamples: contentSamples.filter((s) => s.url.trim()),
          languages: languages.filter((l) => l.name.trim()),
        },
        brandProfile: {
          industry: brandIndustry,
          categories: brandCategories,
          website: brandWebsite,
          socialLinks: brandSocialLinks.filter((l) => l.platform.trim() && l.url.trim()),
          followerCount: brandFollowerCount,
          products: brandProducts.filter((p) => p.name.trim()),
          influencerRequirements: brandRequirements.filter((r) => r.category?.trim()),
          pastCollaborations: brandPastCollaborations.filter((c) => c.brandName.trim()),
        },
        agencyProfile: {
          agencyType,
          website: agencyWebsite,
          socialLinks: agencySocialLinks.filter((l) => l.platform.trim() && l.url.trim()),
          teamSize: agencyTeamSize,
          services: agencyServices,
          clients: agencyClients.filter((c) => c.clientName.trim()),
          pastCampaigns: agencyPastCampaigns.filter((c) => c.brandName.trim()),
        },
        talentPartnerProfile: {
          partnerType: talentPartnerType,
          website: talentPartnerWebsite,
          socialLinks: talentPartnerSocialLinks.filter((l) => l.platform.trim() && l.url.trim()),
          services: splitList(talentPartnerServicesInput),
          brandPartnerships: talentPartnerBrandPartnerships.filter((c) => c.clientName.trim()),
        },
        founderStage,
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

  const resendEmailMutation = useMutation({
    mutationFn: () => authApi.resendVerification(),
  });

  const faceVerificationMutation = useMutation({
    mutationFn: () => userApi.submitFaceVerification(faceSelfie),
    onSuccess: () => {
      refreshUser();
      setFaceSelfie("");
    },
  });

  const bankVerificationMutation = useMutation({
    mutationFn: () => userApi.submitBankVerification(bankVerificationDocuments),
    onSuccess: () => {
      refreshUser();
      setBankVerificationDocuments([]);
    },
  });

  if (!user) return null;

  return (
    <DashboardLayout
      role={sidebarRole}
      title="Edit Profile"
      subtitle="Keep your profile up to date to get better matches."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate(dashboardPathForRole(user.role))}>
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          {publicProfilePathForRole(user.role, user.id) && (
            <Button variant="outline" asChild>
              <Link to={publicProfilePathForRole(user.role, user.id)!}>
                <ExternalLink className="h-4 w-4" /> View Public Profile
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <FormGuidelines
          tips={[
            "Keep your headline and bio clear and concise",
            "Use simple, professional language",
            "Add accurate and honest information",
            "A complete profile builds trust and gets more matches",
          ]}
        />

        {user.role === "freelancer" && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FreelancerTab)}>
            <TabsList className="h-auto flex-wrap gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 p-1.5">
              <TabsTrigger
                value="basic"
                className="gap-1.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <User className="h-3.5 w-3.5" /> Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="professional"
                className="gap-1.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <Briefcase className="h-3.5 w-3.5" /> Professional Details
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="gap-1.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <Image className="h-3.5 w-3.5" /> Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="payout"
                className="gap-1.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <Wallet className="h-3.5 w-3.5" /> Payout &amp; Verification
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <motion.div
          key={user.role === "freelancer" ? activeTab : "static"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-4"
        >

        {showForFreelancerTab("basic") && (
          <BasicInfoSection
            avatar={avatar}
            setAvatar={setAvatar}
            coverImage={coverImage}
            setCoverImage={setCoverImage}
            headline={headline}
            setHeadline={setHeadline}
            country={country}
            setCountry={setCountry}
            state={state}
            setState={setState}
            city={city}
            setCity={setCity}
            bio={bio}
            bioRef={bioRef}
            syncBioFromDom={syncBioFromDom}
            applyBioMarker={applyBioMarker}
          />
        )}

        {user.role === "founder" && (
          <FounderDetailsSection
            founderStage={founderStage}
            setFounderStage={setFounderStage}
            linkedIn={linkedIn}
            setLinkedIn={setLinkedIn}
            twitter={twitter}
            setTwitter={setTwitter}
            github={github}
            setGithub={setGithub}
            website={website}
            setWebsite={setWebsite}
            industriesInput={industriesInput}
            setIndustriesInput={setIndustriesInput}
            skillsInput={skillsInput}
            setSkillsInput={setSkillsInput}
            roleTagsInput={roleTagsInput}
            setRoleTagsInput={setRoleTagsInput}
            lookingForInput={lookingForInput}
            setLookingForInput={setLookingForInput}
            pastStartupsCount={pastStartupsCount}
            setPastStartupsCount={setPastStartupsCount}
            yearsOfExperience={yearsOfExperience}
            setYearsOfExperience={setYearsOfExperience}
          />
        )}

        {user.role === "founder" && (
          <PersonalInfoSection
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            nationality={nationality}
            setNationality={setNationality}
            educationLevel={educationLevel}
            setEducationLevel={setEducationLevel}
            languagesInput={languagesInput}
            setLanguagesInput={setLanguagesInput}
          />
        )}

        {(user.role === "founder" || user.role === "freelancer") && showForFreelancerTab("professional") && (
          <ExperienceEducationSection
            role={user.role}
            experience={experience}
            addExperience={addExperience}
            removeExperience={removeExperience}
            updateExperience={updateExperience}
            education={education}
            addEducation={addEducation}
            removeEducation={removeEducation}
            updateEducation={updateEducation}
            achievements={achievements}
            addAchievement={addAchievement}
            removeAchievement={removeAchievement}
            updateAchievement={updateAchievement}
          />
        )}

        {user.role === "freelancer" && showForFreelancerTab("professional") && (
          <FreelancerDetailsSection
            user={user}
            availabilityStatus={availabilityStatus}
            setAvailabilityStatus={setAvailabilityStatus}
            category={category}
            setCategory={setCategory}
            subCategory={subCategory}
            setSubCategory={setSubCategory}
            skillsInput={skillsInput}
            setSkillsInput={setSkillsInput}
            languagesInput={languagesInput}
            setLanguagesInput={setLanguagesInput}
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            yearsOfExperience={yearsOfExperience}
            setYearsOfExperience={setYearsOfExperience}
            workingHoursStart={workingHoursStart}
            setWorkingHoursStart={setWorkingHoursStart}
            workingHoursEnd={workingHoursEnd}
            setWorkingHoursEnd={setWorkingHoursEnd}
            workingHours={workingHours}
            setWorkingHours={setWorkingHours}
            workingDays={workingDays}
            setWorkingDays={setWorkingDays}
            responseTimeLabel={responseTimeLabel}
            setResponseTimeLabel={setResponseTimeLabel}
            phone={phone}
            setPhone={setPhone}
            videoIntro={videoIntro}
            setVideoIntro={setVideoIntro}
            website={website}
            setWebsite={setWebsite}
            github={github}
            setGithub={setGithub}
            twitter={twitter}
            setTwitter={setTwitter}
          />
        )}

        {((user.role === "freelancer" && showForFreelancerTab("portfolio")) || user.role === "influencer") && (
          <PortfolioSection
            portfolioItems={portfolioItems}
            addPortfolioItem={addPortfolioItem}
            removePortfolioItem={removePortfolioItem}
            updatePortfolioItem={updatePortfolioItem}
            portfolioItemTags={portfolioItemTags}
            portfolioItemVerifiedPaymentId={portfolioItemVerifiedPaymentId}
            suggestedPayments={suggestedPayments}
            addPortfolioItemFromPayment={addPortfolioItemFromPayment}
            verifiablePayments={verifiablePayments}
          />
        )}

        {user.role === "freelancer" && showForFreelancerTab("payout") && (
          <PayoutKycSection
            user={user}
            payoutMethod={payoutMethod}
            setPayoutMethod={setPayoutMethod}
            payoutUpiId={payoutUpiId}
            setPayoutUpiId={setPayoutUpiId}
            payoutBankAccountHolder={payoutBankAccountHolder}
            setPayoutBankAccountHolder={setPayoutBankAccountHolder}
            payoutBankAccountNumber={payoutBankAccountNumber}
            setPayoutBankAccountNumber={setPayoutBankAccountNumber}
            payoutBankIfsc={payoutBankIfsc}
            setPayoutBankIfsc={setPayoutBankIfsc}
            resendEmailMutation={resendEmailMutation}
            kycDocuments={kycDocuments}
            setKycDocuments={setKycDocuments}
            kycMutation={kycMutation}
            faceSelfie={faceSelfie}
            setFaceSelfie={setFaceSelfie}
            faceVerificationMutation={faceVerificationMutation}
            bankVerificationDocuments={bankVerificationDocuments}
            setBankVerificationDocuments={setBankVerificationDocuments}
            bankVerificationMutation={bankVerificationMutation}
          />
        )}

        {user.role === "investor" && (
          <InvestorDetailsSection
            focusInput={focusInput}
            setFocusInput={setFocusInput}
            fundName={fundName}
            setFundName={setFundName}
            fundSize={fundSize}
            setFundSize={setFundSize}
            ticketSizeMin={ticketSizeMin}
            setTicketSizeMin={setTicketSizeMin}
            ticketSizeMax={ticketSizeMax}
            setTicketSizeMax={setTicketSizeMax}
            portfolioCompanyCount={portfolioCompanyCount}
            setPortfolioCompanyCount={setPortfolioCompanyCount}
            preferredStages={preferredStages}
            setPreferredStages={setPreferredStages}
            linkedIn={linkedIn}
            setLinkedIn={setLinkedIn}
            website={website}
            setWebsite={setWebsite}
          />
        )}

        {user.role === "mentor" && (
          <MentorDetailsSection
            expertiseInput={expertiseInput}
            setExpertiseInput={setExpertiseInput}
            sessionRate={sessionRate}
            setSessionRate={setSessionRate}
            sessionFormat={sessionFormat}
            setSessionFormat={setSessionFormat}
            linkedIn={linkedIn}
            setLinkedIn={setLinkedIn}
            hoursPerWeekAvailable={hoursPerWeekAvailable}
            setHoursPerWeekAvailable={setHoursPerWeekAvailable}
            workingDays={workingDays}
            setWorkingDays={setWorkingDays}
          />
        )}

        {user.role === "partner" && (
          <PartnerDetailsSection
            organizationName={organizationName}
            setOrganizationName={setOrganizationName}
            partnerType={partnerType}
            setPartnerType={setPartnerType}
            programDetails={programDetails}
            setProgramDetails={setProgramDetails}
            startupsSupportedCount={startupsSupportedCount}
            setStartupsSupportedCount={setStartupsSupportedCount}
            website={website}
            setWebsite={setWebsite}
            applicationLink={applicationLink}
            setApplicationLink={setApplicationLink}
          />
        )}

        {user.role === "client" && (
          <CompanyDetailsSection
            companyName={companyName}
            setCompanyName={setCompanyName}
            companySize={companySize}
            setCompanySize={setCompanySize}
            industriesInput={industriesInput}
            setIndustriesInput={setIndustriesInput}
            website={website}
            setWebsite={setWebsite}
            companyRegistrationNumber={companyRegistrationNumber}
            setCompanyRegistrationNumber={setCompanyRegistrationNumber}
          />
        )}

        {user.role === "job_seeker" && (
          <JobSeekerDetailsSection
            desiredRole={desiredRole}
            setDesiredRole={setDesiredRole}
            skillsInput={skillsInput}
            setSkillsInput={setSkillsInput}
            yearsOfExperience={yearsOfExperience}
            setYearsOfExperience={setYearsOfExperience}
            expectedSalary={expectedSalary}
            setExpectedSalary={setExpectedSalary}
            noticePeriodDays={noticePeriodDays}
            setNoticePeriodDays={setNoticePeriodDays}
            preferredLocationsInput={preferredLocationsInput}
            setPreferredLocationsInput={setPreferredLocationsInput}
            willingToRelocate={willingToRelocate}
            setWillingToRelocate={setWillingToRelocate}
            resumeUrl={resumeUrl}
            setResumeUrl={setResumeUrl}
          />
        )}

        {user.role === "influencer" && (
          <InfluencerDetailsSection
            availabilityStatus={availabilityStatus}
            setAvailabilityStatus={setAvailabilityStatus}
            category={influencerCategory}
            setCategory={setInfluencerCategory}
            niche={niche}
            setNiche={setNiche}
            mediaKitUrl={mediaKitUrl}
            setMediaKitUrl={setMediaKitUrl}
            website={website}
            setWebsite={setWebsite}
            platforms={platforms}
            addPlatform={addPlatform}
            removePlatform={removePlatform}
            updatePlatform={updatePlatform}
            rateCard={rateCard}
            addRateCardItem={addRateCardItem}
            removeRateCardItem={removeRateCardItem}
            updateRateCardItem={updateRateCardItem}
            pastCollaborations={pastCollaborations}
            addCollaboration={addCollaboration}
            removeCollaboration={removeCollaboration}
            updateCollaboration={updateCollaboration}
            contentSamples={contentSamples}
            addContentSample={addContentSample}
            removeContentSample={removeContentSample}
            updateContentSample={updateContentSample}
            languages={languages}
            addLanguage={addLanguage}
            removeLanguage={removeLanguage}
            updateLanguage={updateLanguage}
            achievements={achievements}
            addAchievement={addAchievement}
            removeAchievement={removeAchievement}
            updateAchievement={updateAchievement}
          />
        )}

        {user.role === "brand" && (
          <BrandDetailsSection
            industry={brandIndustry}
            setIndustry={setBrandIndustry}
            categories={brandCategories}
            setCategories={setBrandCategories}
            website={brandWebsite}
            setWebsite={setBrandWebsite}
            socialLinks={brandSocialLinks}
            setSocialLinks={setBrandSocialLinks}
            followerCount={brandFollowerCount}
            setFollowerCount={setBrandFollowerCount}
            products={brandProducts}
            addProduct={addBrandProduct}
            removeProduct={removeBrandProduct}
            updateProduct={updateBrandProduct}
            requirements={brandRequirements}
            addRequirement={addBrandRequirement}
            removeRequirement={removeBrandRequirement}
            updateRequirement={updateBrandRequirement}
            pastCollaborations={brandPastCollaborations}
            addCollaboration={addBrandCollaboration}
            removeCollaboration={removeBrandCollaboration}
            updateCollaboration={updateBrandCollaboration}
          />
        )}

        {user.role === "agency" && (
          <AgencyDetailsSection
            agencyType={agencyType}
            setAgencyType={setAgencyType}
            website={agencyWebsite}
            setWebsite={setAgencyWebsite}
            socialLinks={agencySocialLinks}
            setSocialLinks={setAgencySocialLinks}
            teamSize={agencyTeamSize}
            setTeamSize={setAgencyTeamSize}
            services={agencyServices}
            setServices={setAgencyServices}
            clients={agencyClients}
            addClient={addAgencyClient}
            removeClient={removeAgencyClient}
            updateClient={updateAgencyClient}
            pastCampaigns={agencyPastCampaigns}
            addPastCampaign={addAgencyPastCampaign}
            removePastCampaign={removeAgencyPastCampaign}
            updatePastCampaign={updateAgencyPastCampaign}
          />
        )}

        {user.role === "talent_partner" && (
          <TalentPartnerDetailsSection
            partnerType={talentPartnerType}
            setPartnerType={setTalentPartnerType}
            website={talentPartnerWebsite}
            setWebsite={setTalentPartnerWebsite}
            socialLinks={talentPartnerSocialLinks}
            setSocialLinks={setTalentPartnerSocialLinks}
            servicesInput={talentPartnerServicesInput}
            setServicesInput={setTalentPartnerServicesInput}
            brandPartnerships={talentPartnerBrandPartnerships}
            addBrandPartnership={addTalentPartnership}
            removeBrandPartnership={removeTalentPartnership}
            updateBrandPartnership={updateTalentPartnership}
          />
        )}

        {mutation.isSuccess && <p className="text-sm font-medium text-success">Profile updated successfully.</p>}
        {mutation.isError && <p className="text-sm text-danger">Something went wrong while saving your profile.</p>}

        <div className="flex justify-end">
          {user.role === "freelancer" && activeTab !== "payout" ? (
            <Button
              variant="gradient"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(undefined, { onSuccess: () => setActiveTab(nextFreelancerTab(activeTab)) })}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save &amp; Next
            </Button>
          ) : (
            <Button variant="gradient" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          )}
        </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
