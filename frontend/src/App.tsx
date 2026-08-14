import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLoader } from "@/components/shared/PageLoader";
import { JobsFeatureGate } from "@/components/shared/JobsFeatureGate";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { SkipToContentLink } from "@/components/shared/SkipToContentLink";
import { ComingSoon } from "@/pages/ComingSoon";

const Home = lazy(() => import("@/pages/Home"));
const Explore = lazy(() => import("@/pages/dashboard/Explore"));
const OverlapCardDemo = lazy(() => import("@/pages/demo/OverlapCardDemo"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("@/pages/legal/RefundPolicy"));

const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));

const SelectCategory = lazy(() => import("@/pages/onboarding/SelectCategory"));
const SelectRoles = lazy(() => import("@/pages/onboarding/SelectRoles"));

const StartupList = lazy(() => import("@/roles/founder/pages/StartupList"));
const StartupDetails = lazy(() => import("@/roles/founder/pages/StartupDetails"));
const CreateStartup = lazy(() => import("@/roles/founder/pages/CreateStartup"));
const MyStartups = lazy(() => import("@/roles/founder/pages/MyStartups"));

const JobList = lazy(() => import("@/pages/jobs/JobList"));
const JobDetails = lazy(() => import("@/pages/jobs/JobDetails"));
const ProjectDetails = lazy(() => import("@/pages/projects/ProjectDetails"));
const PostJob = lazy(() => import("@/pages/jobs/PostJob"));
const JobApplicants = lazy(() => import("@/pages/jobs/JobApplicants"));
const PostProject = lazy(() => import("@/pages/projects/PostProject"));
const CampaignList = lazy(() => import("@/pages/campaigns/CampaignList"));
const CampaignDetails = lazy(() => import("@/pages/campaigns/CampaignDetails"));
const PostCampaign = lazy(() => import("@/pages/campaigns/PostCampaign"));
const MyCampaigns = lazy(() => import("@/pages/campaigns/MyCampaigns"));
const MyRoster = lazy(() => import("@/pages/campaigns/MyRoster"));
const CampaignApplicants = lazy(() => import("@/pages/campaigns/CampaignApplicants"));
const MyClients = lazy(() => import("@/pages/campaigns/MyClients"));
const MyAgencies = lazy(() => import("@/pages/campaigns/MyAgencies"));
const CampaignReport = lazy(() => import("@/pages/campaigns/CampaignReport"));
const ContestList = lazy(() => import("@/pages/contests/ContestList"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const ContestDetails = lazy(() => import("@/pages/contests/ContestDetails"));
const PostContest = lazy(() => import("@/pages/contests/PostContest"));
const MyContests = lazy(() => import("@/pages/contests/MyContests"));
const ContestEntriesReview = lazy(() => import("@/pages/contests/ContestEntriesReview"));
const MyContestEntries = lazy(() => import("@/pages/contests/MyContestEntries"));

const FreelancerList = lazy(() => import("@/roles/freelancer/pages/FreelancerList"));
const FreelancerProfile = lazy(() => import("@/roles/freelancer/pages/FreelancerProfile"));
const GigProfile = lazy(() => import("@/pages/gigs/GigProfile"));
const MyGigs = lazy(() => import("@/pages/gigs/MyGigs"));
const CreateGig = lazy(() => import("@/pages/gigs/CreateGig"));

const InvestorList = lazy(() => import("@/roles/investor/pages/InvestorList"));
const InvestorProfile = lazy(() => import("@/roles/investor/pages/InvestorProfile"));
const MentorList = lazy(() => import("@/pages/mentors/MentorList"));
const MentorProfile = lazy(() => import("@/pages/mentors/MentorProfile"));
const PartnerList = lazy(() => import("@/pages/partners/PartnerList"));
const PartnerProfile = lazy(() => import("@/pages/partners/PartnerProfile"));
const FounderProfile = lazy(() => import("@/roles/founder/pages/FounderProfile"));
const JobSeekerList = lazy(() => import("@/roles/job-seeker/pages/JobSeekerList"));
const JobSeekerProfile = lazy(() => import("@/roles/job-seeker/pages/JobSeekerProfile"));
const InfluencerList = lazy(() => import("@/pages/influencers/InfluencerList"));
const InfluencerProfile = lazy(() => import("@/pages/influencers/InfluencerProfile"));
const RosterInvites = lazy(() => import("@/pages/influencers/RosterInvites"));
const CampaignInvites = lazy(() => import("@/pages/influencers/CampaignInvites"));
const ShortlistedInfluencers = lazy(() => import("@/pages/influencers/ShortlistedInfluencers"));
const BrandProfile = lazy(() => import("@/pages/profiles/BrandProfile"));
const AgencyProfile = lazy(() => import("@/pages/profiles/AgencyProfile"));
const TalentPartnerProfile = lazy(() => import("@/pages/profiles/TalentPartnerProfile"));
const BrandList = lazy(() => import("@/pages/profiles/BrandList"));
const AgencyList = lazy(() => import("@/pages/profiles/AgencyList"));
const TalentPartnerList = lazy(() => import("@/pages/profiles/TalentPartnerList"));

const Messages = lazy(() => import("@/pages/chat/Messages"));
const Referrals = lazy(() => import("@/pages/dashboard/Referrals"));
const Invoice = lazy(() => import("@/pages/payments/Invoice"));

const FounderDashboard = lazy(() => import("@/roles/founder/pages/dashboard/FounderDashboard"));
const FounderApplications = lazy(() => import("@/roles/founder/pages/dashboard/FounderApplications"));
const FounderInvestors = lazy(() => import("@/roles/founder/pages/dashboard/FounderInvestors"));
const FreelancerDashboard = lazy(() => import("@/roles/freelancer/pages/dashboard/FreelancerDashboard"));
const FreelancerAnalytics = lazy(() => import("@/roles/freelancer/pages/dashboard/FreelancerAnalytics"));
const NotificationsPage = lazy(() => import("@/pages/dashboard/NotificationsPage"));
const JobSeekerDashboard = lazy(() => import("@/roles/job-seeker/pages/dashboard/JobSeekerDashboard"));
const JobSeekerInterviews = lazy(() => import("@/roles/job-seeker/pages/dashboard/JobSeekerInterviews"));
const InfluencerDashboard = lazy(() => import("@/pages/dashboard/InfluencerDashboard"));
const FreelancerApplications = lazy(() => import("@/roles/freelancer/pages/dashboard/FreelancerApplications"));
const FreelancerProjects = lazy(() => import("@/roles/freelancer/pages/dashboard/FreelancerProjects"));
const FreelancerReviews = lazy(() => import("@/roles/freelancer/pages/dashboard/FreelancerReviews"));
const FreelancerEarnings = lazy(() => import("@/roles/freelancer/pages/dashboard/FreelancerEarnings"));
const FreelancerOrders = lazy(() => import("@/roles/freelancer/pages/dashboard/FreelancerOrders"));
const SavedItems = lazy(() => import("@/pages/dashboard/SavedItems"));
const SkillTests = lazy(() => import("@/pages/dashboard/SkillTests"));
const FreelancerAlerts = lazy(() => import("@/pages/dashboard/FreelancerAlerts"));
const MyPayments = lazy(() => import("@/pages/dashboard/MyPayments"));
const EmployerDashboard = lazy(() => import("@/pages/dashboard/EmployerDashboard"));
const InvestorDashboard = lazy(() => import("@/roles/investor/pages/dashboard/InvestorDashboard"));
const PartnerDashboard = lazy(() => import("@/pages/dashboard/PartnerDashboard"));
const MentorDashboard = lazy(() => import("@/pages/dashboard/MentorDashboard"));
const EditProfile = lazy(() => import("@/pages/dashboard/EditProfile"));
const VerifyRole = lazy(() => import("@/pages/dashboard/VerifyRole"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const AdminOverview = lazy(() => import("@/roles/admin/pages/AdminOverview"));
const AdminUsers = lazy(() => import("@/roles/admin/pages/AdminUsers"));
const AdminFlaggedStartups = lazy(() => import("@/roles/admin/pages/AdminFlaggedStartups"));
const AdminStartups = lazy(() => import("@/roles/admin/pages/AdminStartups"));
const AdminGigs = lazy(() => import("@/roles/admin/pages/AdminGigs"));
const AdminContests = lazy(() => import("@/roles/admin/pages/AdminContests"));
const AdminPayments = lazy(() => import("@/roles/admin/pages/AdminPayments"));
const AdminWithdrawals = lazy(() => import("@/roles/admin/pages/AdminWithdrawals"));
const AdminGrievances = lazy(() => import("@/roles/admin/pages/AdminGrievances"));
const AdminStaff = lazy(() => import("@/roles/admin/pages/AdminStaff"));
const AdminActivity = lazy(() => import("@/roles/admin/pages/AdminActivity"));
const AdminKyc = lazy(() => import("@/roles/admin/pages/AdminKyc"));
const AdminProfileVerifications = lazy(() => import("@/roles/admin/pages/AdminProfileVerifications"));
const AdminRoleVerifications = lazy(() => import("@/roles/admin/pages/AdminRoleVerifications"));
const AdminSettings = lazy(() => import("@/roles/admin/pages/AdminSettings"));
const AdminPlans = lazy(() => import("@/roles/admin/pages/AdminPlans"));
const AdminSkillTests = lazy(() => import("@/roles/admin/pages/AdminSkillTests"));
const CompanyTeam = lazy(() => import("@/pages/dashboard/CompanyTeam"));
const AdminJobs = lazy(() => import("@/roles/admin/pages/AdminJobs"));

const withMarketingLayout = (node: React.ReactNode) => <MarketingLayout>{node}</MarketingLayout>;

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SkipToContentLink />
      <CookieConsentBanner />
      <Routes>
        <Route path="/" element={withMarketingLayout(<Home />)} />
        <Route path="/demo/overlap-card" element={withMarketingLayout(<OverlapCardDemo />)} />

        <Route path="/startups" element={withMarketingLayout(<StartupList />)} />
        <Route path="/startups/:id" element={withMarketingLayout(<StartupDetails />)} />

        {/* Real on/off switch — Platform Settings -> "Jobs Feature"
            (AdminSettings.tsx) — not a hardcoded disable. JobsFeatureGate
            renders NotFound instead of the real page while it's off. */}
        <Route path="/jobs" element={withMarketingLayout(<JobsFeatureGate><JobList /></JobsFeatureGate>)} />
        <Route path="/jobs/:id" element={withMarketingLayout(<JobsFeatureGate><JobDetails /></JobsFeatureGate>)} />
        <Route path="/campaigns" element={withMarketingLayout(<CampaignList />)} />
        <Route path="/campaigns/:id" element={withMarketingLayout(<CampaignDetails />)} />
        <Route path="/projects/:id" element={withMarketingLayout(<ProjectDetails />)} />

        <Route path="/contests" element={withMarketingLayout(<ContestList />)} />
        <Route path="/contests/:id" element={withMarketingLayout(<ContestDetails />)} />

        <Route path="/search" element={withMarketingLayout(<SearchResults />)} />

        <Route path="/freelancers" element={withMarketingLayout(<FreelancerList />)} />
        <Route path="/freelancers/:id" element={withMarketingLayout(<FreelancerProfile />)} />
        <Route path="/services/:id" element={withMarketingLayout(<GigProfile />)} />

        <Route path="/investors" element={withMarketingLayout(<InvestorList />)} />
        <Route path="/investors/:id" element={withMarketingLayout(<InvestorProfile />)} />
        <Route path="/mentors" element={withMarketingLayout(<MentorList />)} />
        <Route path="/mentors/:id" element={withMarketingLayout(<MentorProfile />)} />
        <Route path="/partners" element={withMarketingLayout(<PartnerList />)} />
        <Route path="/partners/:id" element={withMarketingLayout(<PartnerProfile />)} />
        <Route path="/founders/:id" element={withMarketingLayout(<FounderProfile />)} />
        <Route path="/job-seekers" element={withMarketingLayout(<JobSeekerList />)} />
        <Route path="/job-seekers/:id" element={withMarketingLayout(<JobSeekerProfile />)} />
        <Route path="/influencers" element={withMarketingLayout(<InfluencerList />)} />
        <Route path="/influencers/:id" element={withMarketingLayout(<InfluencerProfile />)} />
        <Route path="/brands" element={withMarketingLayout(<BrandList />)} />
        <Route path="/brands/:id" element={withMarketingLayout(<BrandProfile />)} />
        <Route path="/agencies" element={withMarketingLayout(<AgencyList />)} />
        <Route path="/agencies/:id" element={withMarketingLayout(<AgencyProfile />)} />
        <Route path="/talent-partners" element={withMarketingLayout(<TalentPartnerList />)} />
        <Route path="/talent-partners/:id" element={withMarketingLayout(<TalentPartnerProfile />)} />

        <Route path="/pricing" element={withMarketingLayout(<Pricing />)} />

        <Route path="/community" element={withMarketingLayout(<ComingSoon title="Community" />)} />
        <Route path="/about" element={withMarketingLayout(<About />)} />
        <Route path="/contact" element={withMarketingLayout(<Contact />)} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/terms" element={withMarketingLayout(<TermsOfService />)} />
        <Route path="/privacy" element={withMarketingLayout(<PrivacyPolicy />)} />
        <Route path="/refund" element={withMarketingLayout(<RefundPolicy />)} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/onboarding/category"
          element={
            <ProtectedRoute>
              <SelectCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/roles"
          element={
            <ProtectedRoute>
              <SelectRoles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/explore"
          element={
            <ProtectedRoute>
              {withMarketingLayout(<Explore />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/referrals"
          element={
            <ProtectedRoute>
              <Referrals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id/invoice"
          element={
            <ProtectedRoute>
              <Invoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/verify-role"
          element={
            <ProtectedRoute>
              <VerifyRole />
            </ProtectedRoute>
          }
        />

        {/* Founder */}
        <Route
          path="/dashboard/founder"
          element={
            <ProtectedRoute allow={["founder", "super_admin"]}>
              <FounderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/founder/startups"
          element={
            <ProtectedRoute allow={["founder", "super_admin"]}>
              <MyStartups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/founder/applications"
          element={
            <ProtectedRoute allow={["founder", "super_admin"]}>
              <FounderApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/founder/investors"
          element={
            <ProtectedRoute allow={["founder", "super_admin"]}>
              <FounderInvestors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/founder/startup"
          element={
            <ProtectedRoute allow={["founder", "super_admin"]}>
              {withMarketingLayout(<CreateStartup />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/founder/startup/:id"
          element={
            <ProtectedRoute allow={["founder", "super_admin"]}>
              {withMarketingLayout(<CreateStartup />)}
            </ProtectedRoute>
          }
        />

        {/* Freelancer */}
        <Route
          path="/dashboard/freelancer"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/analytics"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/gigs"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <MyGigs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/company"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <CompanyTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/gigs/new"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <CreateGig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/gigs/:id/edit"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <CreateGig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/applications"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/contests"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <MyContestEntries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/projects"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/reviews"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/earnings"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/orders"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/saved"
          element={
            <ProtectedRoute allow={["freelancer", "job_seeker", "super_admin"]}>
              <SavedItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/skill-tests"
          element={
            <ProtectedRoute allow={["job_seeker", "super_admin"]}>
              <SkillTests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/alerts"
          element={
            <ProtectedRoute allow={["freelancer", "job_seeker", "super_admin"]}>
              <FreelancerAlerts />
            </ProtectedRoute>
          }
        />

        {/* Job Seeker */}
        <Route
          path="/dashboard/job-seeker"
          element={
            <ProtectedRoute allow={["job_seeker", "super_admin"]}>
              <JobSeekerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/job-seeker/interviews"
          element={
            <ProtectedRoute allow={["job_seeker", "super_admin"]}>
              <JobSeekerInterviews />
            </ProtectedRoute>
          }
        />

        {/* Influencer */}
        <Route
          path="/dashboard/influencer"
          element={
            <ProtectedRoute allow={["influencer", "super_admin"]}>
              <InfluencerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/influencer/roster-invites"
          element={
            <ProtectedRoute allow={["influencer", "super_admin"]}>
              <RosterInvites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/influencer/campaign-invites"
          element={
            <ProtectedRoute allow={["influencer", "super_admin"]}>
              <CampaignInvites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/influencer/earnings"
          element={
            <ProtectedRoute allow={["influencer", "super_admin"]}>
              <FreelancerEarnings />
            </ProtectedRoute>
          }
        />

        {/* Employer */}
        <Route
          path="/dashboard/employer"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/post-job"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/jobs/:id/edit"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/jobs/:id/applicants"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <JobApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/campaigns"
          element={
            <ProtectedRoute allow={["employer", "brand", "agency", "talent_partner", "super_admin"]}>
              <MyCampaigns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/post-campaign"
          element={
            <ProtectedRoute allow={["employer", "brand", "agency", "talent_partner", "super_admin"]}>
              <PostCampaign />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/campaigns/:id/edit"
          element={
            <ProtectedRoute allow={["employer", "brand", "agency", "talent_partner", "super_admin"]}>
              <PostCampaign />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/campaigns/:id/applicants"
          element={
            <ProtectedRoute allow={["employer", "brand", "agency", "talent_partner", "super_admin"]}>
              <CampaignApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/campaigns/:id/report"
          element={
            <ProtectedRoute allow={["employer", "brand", "agency", "talent_partner", "super_admin"]}>
              <CampaignReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/clients"
          element={
            <ProtectedRoute allow={["agency", "super_admin"]}>
              <MyClients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/agencies"
          element={
            <ProtectedRoute allow={["brand", "employer", "client", "super_admin"]}>
              <MyAgencies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/contests"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <MyContests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/post-contest"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <PostContest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/contests/:id/edit"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <PostContest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/contests/:id/entries"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <ContestEntriesReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/roster"
          element={
            <ProtectedRoute allow={["agency", "talent_partner", "super_admin"]}>
              <MyRoster />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/shortlist"
          element={
            <ProtectedRoute allow={["employer", "client", "brand", "agency", "talent_partner", "super_admin"]}>
              <ShortlistedInfluencers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/company"
          element={
            <ProtectedRoute allow={["employer", "brand", "agency", "talent_partner", "super_admin"]}>
              <CompanyTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/payments"
          element={
            <ProtectedRoute allow={["employer", "brand", "agency", "talent_partner", "super_admin"]}>
              <MyPayments />
            </ProtectedRoute>
          }
        />

        {/* Brand/Agency/Talent Partner overview — same shared campaign-hiring
            pages as Employer (basePath stays /dashboard/employer), just each
            role's own landing page with its own stats. */}
        <Route
          path="/dashboard/brand"
          element={
            <ProtectedRoute allow={["brand", "super_admin"]}>
              <EmployerDashboard role="brand" basePath="/dashboard/employer" entityLabel="Campaign" source="campaign" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/agency"
          element={
            <ProtectedRoute allow={["agency", "super_admin"]}>
              <EmployerDashboard role="agency" basePath="/dashboard/employer" entityLabel="Campaign" source="campaign" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/talent-partner"
          element={
            <ProtectedRoute allow={["talent_partner", "super_admin"]}>
              <EmployerDashboard role="talent_partner" basePath="/dashboard/employer" entityLabel="Campaign" source="campaign" />
            </ProtectedRoute>
          }
        />

        {/* Client */}
        <Route
          path="/dashboard/client"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <EmployerDashboard role="client" basePath="/dashboard/client" entityLabel="Project" source="project" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/post-job"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <PostProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/company"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <CompanyTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/projects/:id/edit"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <PostProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/projects/:id/applicants"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <JobApplicants role="client" basePath="/dashboard/client" source="project" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/contests"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <MyContests role="client" basePath="/dashboard/client" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/post-contest"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <PostContest role="client" basePath="/dashboard/client/contests" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/contests/:id/edit"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <PostContest role="client" basePath="/dashboard/client/contests" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/contests/:id/entries"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <ContestEntriesReview role="client" basePath="/dashboard/client" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/payments"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <MyPayments role="client" />
            </ProtectedRoute>
          }
        />

        {/* Investor */}
        <Route
          path="/dashboard/investor"
          element={
            <ProtectedRoute allow={["investor", "super_admin"]}>
              <InvestorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Mentor */}
        <Route
          path="/dashboard/mentor"
          element={
            <ProtectedRoute allow={["mentor", "super_admin"]}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Partner */}
        <Route
          path="/dashboard/partner"
          element={
            <ProtectedRoute allow={["partner", "super_admin"]}>
              <PartnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin — "staff" is a super_admin-created account scoped to a
            subset of sections via staffPermissions (see AdminStaff.tsx).
            Routes below pass `permission` wherever a staff account can be
            granted access; routes with none (Users, Payments, Withdrawals,
            Settings, Plans, Staff itself) stay allow={["super_admin"]} only
            — never delegable, matching admin.routes.js on the backend. */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]}>
              <AdminOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/users"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/staff"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/activity"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminActivity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/flagged-startups"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="flagged-startups">
              <AdminFlaggedStartups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/startups"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="startups">
              <AdminStartups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/gigs"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="gigs">
              <AdminGigs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/contests"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="contests">
              <AdminContests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/payments"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/jobs"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="jobs">
              <AdminJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/withdrawals"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminWithdrawals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/grievances"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="grievances">
              <AdminGrievances />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/kyc"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="kyc">
              <AdminKyc />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/profile-verifications"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="profile-verifications">
              <AdminProfileVerifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/role-verifications"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="role-verifications">
              <AdminRoleVerifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/settings"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/plans"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminPlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/skill-tests"
          element={
            <ProtectedRoute allow={["super_admin", "staff"]} permission="skill-tests">
              <AdminSkillTests />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
