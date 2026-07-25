import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLoader } from "@/components/shared/PageLoader";
import { ComingSoon } from "@/pages/ComingSoon";

const Home = lazy(() => import("@/pages/Home"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("@/pages/legal/RefundPolicy"));

const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));

const StartupList = lazy(() => import("@/pages/startups/StartupList"));
const StartupDetails = lazy(() => import("@/pages/startups/StartupDetails"));
const CreateStartup = lazy(() => import("@/pages/startups/CreateStartup"));
const MyStartups = lazy(() => import("@/pages/startups/MyStartups"));

const JobList = lazy(() => import("@/pages/jobs/JobList"));
const JobDetails = lazy(() => import("@/pages/jobs/JobDetails"));
const ProjectDetails = lazy(() => import("@/pages/projects/ProjectDetails"));
const PostJob = lazy(() => import("@/pages/jobs/PostJob"));
const JobApplicants = lazy(() => import("@/pages/jobs/JobApplicants"));
const PostProject = lazy(() => import("@/pages/projects/PostProject"));
const ClientProjectApplicants = lazy(() => import("@/pages/projects/ClientProjectApplicants"));
const ContestList = lazy(() => import("@/pages/contests/ContestList"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const ContestDetails = lazy(() => import("@/pages/contests/ContestDetails"));
const PostContest = lazy(() => import("@/pages/contests/PostContest"));
const MyContests = lazy(() => import("@/pages/contests/MyContests"));
const ContestEntriesReview = lazy(() => import("@/pages/contests/ContestEntriesReview"));
const ClientPostContest = lazy(() => import("@/pages/contests/ClientPostContest"));
const ClientMyContests = lazy(() => import("@/pages/contests/ClientMyContests"));
const ClientContestEntries = lazy(() => import("@/pages/contests/ClientContestEntries"));
const MyContestEntries = lazy(() => import("@/pages/contests/MyContestEntries"));

const FreelancerList = lazy(() => import("@/pages/freelancers/FreelancerList"));
const FreelancerProfile = lazy(() => import("@/pages/freelancers/FreelancerProfile"));
const GigProfile = lazy(() => import("@/pages/gigs/GigProfile"));
const MyGigs = lazy(() => import("@/pages/gigs/MyGigs"));
const CreateGig = lazy(() => import("@/pages/gigs/CreateGig"));

const InvestorList = lazy(() => import("@/pages/investors/InvestorList"));
const InvestorProfile = lazy(() => import("@/pages/investors/InvestorProfile"));
const MentorList = lazy(() => import("@/pages/mentors/MentorList"));
const MentorProfile = lazy(() => import("@/pages/mentors/MentorProfile"));
const PartnerList = lazy(() => import("@/pages/partners/PartnerList"));
const PartnerProfile = lazy(() => import("@/pages/partners/PartnerProfile"));
const FounderProfile = lazy(() => import("@/pages/founders/FounderProfile"));

const Messages = lazy(() => import("@/pages/chat/Messages"));
const Referrals = lazy(() => import("@/pages/dashboard/Referrals"));
const Invoice = lazy(() => import("@/pages/payments/Invoice"));

const FounderDashboard = lazy(() => import("@/pages/dashboard/FounderDashboard"));
const FounderApplications = lazy(() => import("@/pages/dashboard/FounderApplications"));
const FounderInvestors = lazy(() => import("@/pages/dashboard/FounderInvestors"));
const FreelancerDashboard = lazy(() => import("@/pages/dashboard/FreelancerDashboard"));
const FreelancerApplications = lazy(() => import("@/pages/dashboard/FreelancerApplications"));
const FreelancerProjects = lazy(() => import("@/pages/dashboard/FreelancerProjects"));
const FreelancerReviews = lazy(() => import("@/pages/dashboard/FreelancerReviews"));
const FreelancerEarnings = lazy(() => import("@/pages/dashboard/FreelancerEarnings"));
const FreelancerOrders = lazy(() => import("@/pages/dashboard/FreelancerOrders"));
const SavedItems = lazy(() => import("@/pages/dashboard/SavedItems"));
const SkillTests = lazy(() => import("@/pages/dashboard/SkillTests"));
const FreelancerAlerts = lazy(() => import("@/pages/dashboard/FreelancerAlerts"));
const MyPayments = lazy(() => import("@/pages/dashboard/MyPayments"));
const EmployerDashboard = lazy(() => import("@/pages/dashboard/EmployerDashboard"));
const ClientDashboard = lazy(() => import("@/pages/dashboard/ClientDashboard"));
const InvestorDashboard = lazy(() => import("@/pages/dashboard/InvestorDashboard"));
const MentorDashboard = lazy(() => import("@/pages/dashboard/MentorDashboard"));
const EditProfile = lazy(() => import("@/pages/dashboard/EditProfile"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const AdminOverview = lazy(() => import("@/pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminFlaggedStartups = lazy(() => import("@/pages/admin/AdminFlaggedStartups"));
const AdminStartups = lazy(() => import("@/pages/admin/AdminStartups"));
const AdminGigs = lazy(() => import("@/pages/admin/AdminGigs"));
const AdminContests = lazy(() => import("@/pages/admin/AdminContests"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminWithdrawals = lazy(() => import("@/pages/admin/AdminWithdrawals"));
const AdminKyc = lazy(() => import("@/pages/admin/AdminKyc"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminSkillTests = lazy(() => import("@/pages/admin/AdminSkillTests"));
const CompanyTeam = lazy(() => import("@/pages/dashboard/CompanyTeam"));
const AdminJobs = lazy(() => import("@/pages/admin/AdminJobs"));

const withMarketingLayout = (node: React.ReactNode) => <MarketingLayout>{node}</MarketingLayout>;

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={withMarketingLayout(<Home />)} />

        <Route path="/startups" element={withMarketingLayout(<StartupList />)} />
        <Route path="/startups/:id" element={withMarketingLayout(<StartupDetails />)} />

        <Route path="/jobs" element={withMarketingLayout(<JobList />)} />
        <Route path="/jobs/:id" element={withMarketingLayout(<JobDetails />)} />
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

        <Route path="/pricing" element={withMarketingLayout(<Pricing />)} />

        <Route path="/community" element={withMarketingLayout(<ComingSoon title="Community" />)} />
        <Route path="/about" element={withMarketingLayout(<ComingSoon title="About MahaHub" />)} />
        <Route path="/contact" element={withMarketingLayout(<ComingSoon title="Contact Us" />)} />
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
          path="/dashboard/messages"
          element={
            <ProtectedRoute>
              <Messages />
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
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <SavedItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/skill-tests"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <SkillTests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer/alerts"
          element={
            <ProtectedRoute allow={["freelancer", "super_admin"]}>
              <FreelancerAlerts />
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
          path="/dashboard/employer/company"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <CompanyTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employer/payments"
          element={
            <ProtectedRoute allow={["employer", "super_admin"]}>
              <MyPayments role="employer" />
            </ProtectedRoute>
          }
        />

        {/* Client */}
        <Route
          path="/dashboard/client"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <ClientDashboard />
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
              <ClientProjectApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/contests"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <ClientMyContests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/post-contest"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <ClientPostContest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/contests/:id/edit"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <ClientPostContest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client/contests/:id/entries"
          element={
            <ProtectedRoute allow={["client", "super_admin"]}>
              <ClientContestEntries />
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

        {/* Admin */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allow={["super_admin"]}>
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
          path="/dashboard/admin/flagged-startups"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminFlaggedStartups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/startups"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminStartups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/gigs"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminGigs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/contests"
          element={
            <ProtectedRoute allow={["super_admin"]}>
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
            <ProtectedRoute allow={["super_admin"]}>
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
          path="/dashboard/admin/kyc"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminKyc />
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
          path="/dashboard/admin/skill-tests"
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <AdminSkillTests />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
