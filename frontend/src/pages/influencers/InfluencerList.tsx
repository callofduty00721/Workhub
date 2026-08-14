import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users2, ShieldCheck, MessageSquare, TrendingUp, Send, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { SimpleHero } from "@/components/shared/SimpleHero";
import { InfluencerCard } from "@/pages/influencers/InfluencerCard";
import InfluencerFilterSidebar, { FOLLOWER_RANGE_OPTIONS } from "@/pages/influencers/InfluencerFilterSidebar";
import { InfluencerCategoryTabs } from "@/pages/influencers/InfluencerCategoryTabs";
import { DirectoryTabs } from "@/pages/profiles/DirectoryTabs";
import { influencerApi, type InfluencerSort } from "@/api/influencers";

// Real platform capabilities — no fabricated numbers.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified profiles", color: "text-green-500" },
  { icon: MessageSquare, label: "Direct messaging", color: "text-blue-500" },
  { icon: TrendingUp, label: "Real engagement data", color: "text-purple-500" },
];

// Same flat palette + process-strip pattern as PremiumHero/JobList — matches
// the real flow (InfluencerCard's Collaborate button opens a real chat
// thread via chatApi.getOrCreateConversation), not a made-up funnel.
const STEP_COLORS = [
  { color: "#D97706", tint: "#FEF3C7" },
  { color: "#10B981", tint: "#ECFDF5" },
  { color: "#0284C7", tint: "#E0F2FE" },
  { color: "#9333EA", tint: "#F3E8FF" },
];

const COLLAB_PROCESS = [
  { icon: Users2, title: "Browse influencers", desc: "Real profiles, real audience data" },
  { icon: Send, title: "Message directly", desc: "Reach out and discuss your campaign" },
  { icon: CalendarCheck, title: "Agree on deliverables", desc: "Discuss content, timeline, and rate" },
  { icon: CheckCircle2, title: "Collaborate", desc: "Work together on your campaign" },
];

export default function InfluencerList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [niche, setNiche] = useState("any");
  const [location, setLocation] = useState("");
  const [minRating, setMinRating] = useState("any");
  const [platform, setPlatform] = useState("any");
  const [followerRange, setFollowerRange] = useState("any");
  const [maxBudget, setMaxBudget] = useState("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<InfluencerSort>("newest");
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  // Shared by the top category-tabs row and the sidebar's Category select —
  // both need to reset niche (it belongs to the old category) and the page.
  const selectCategory = (v: string) => {
    setCategory(v);
    setNiche("any");
    resetPage();
  };

  const selectedFollowerRange = FOLLOWER_RANGE_OPTIONS.find((r) => r.label === followerRange);

  const { data, isLoading } = useQuery({
    queryKey: ["influencers", { search, category, niche, location, minRating, platform, followerRange, maxBudget, verifiedOnly, sort, page }],
    queryFn: () =>
      influencerApi.list({
        search: search || undefined,
        category: category !== "all" ? category : undefined,
        niche: niche !== "any" ? niche : undefined,
        location: location || undefined,
        minRating: minRating !== "any" ? Number(minRating) : undefined,
        platform: platform !== "any" ? platform : undefined,
        minFollowers: selectedFollowerRange?.min,
        maxFollowers: selectedFollowerRange && Number.isFinite(selectedFollowerRange.max) ? selectedFollowerRange.max : undefined,
        maxBudget: maxBudget !== "any" ? Number(maxBudget) : undefined,
        verifiedOnly: verifiedOnly || undefined,
        sort,
        page,
        limit: 12,
      }),
  });

  return (
    <div className="bg-black">
      <DirectoryTabs variant="dark" />

      <SimpleHero
        badgeIcon={Users2}
        badgeText={(data?.pagination.total ?? 0) > 0 ? `${data!.pagination.total.toLocaleString()} influencers to discover` : "Browse creators"}
        title="Find the right"
        accent="influencer"
        description="Discover creators to collaborate with or hire for a campaign."
        trustPoints={TRUST_POINTS}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          resetPage();
        }}
        searchPlaceholder="Search influencers..."
        variant="dark"
      />

      <section className="relative overflow-hidden border-t border-white/[0.08] bg-black pb-12 pt-4 sm:pb-14 sm:pt-6">
        <div className="container">
          <h2 className="mb-8 text-center font-display text-[24px] font-black tracking-tight text-white sm:text-[27px]">
            How collaborating works
          </h2>

          <div className="relative">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-white/[0.08] sm:block" />
            <div className="relative grid grid-cols-2 gap-y-8 sm:grid-cols-4">
              {COLLAB_PROCESS.map((step, i) => {
                const c = STEP_COLORS[i % STEP_COLORS.length];
                return (
                  <div key={step.title} className="flex flex-col items-center text-center">
                    <span
                      style={{ color: c.color }}
                      className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-[#0A0A0A]"
                    >
                      <step.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-[16px] font-bold text-white">{step.title}</h3>
                    <p className="mt-1 max-w-[150px] text-[13.5px] leading-snug text-[#A1A1AA]">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <InfluencerCategoryTabs active={category} onSelect={selectCategory} />

      <div className="container grid grid-cols-1 items-start gap-2 border-t border-white/[0.08] py-10 lg:grid-cols-[260px_1fr]">
        <InfluencerFilterSidebar
          category={category}
          setCategory={(v) => {
            setCategory(v);
            resetPage();
          }}
          niche={niche}
          setNiche={(v) => {
            setNiche(v);
            resetPage();
          }}
          location={location}
          setLocation={(v) => {
            setLocation(v);
            resetPage();
          }}
          minRating={minRating}
          setMinRating={(v) => {
            setMinRating(v);
            resetPage();
          }}
          platform={platform}
          setPlatform={(v) => {
            setPlatform(v);
            resetPage();
          }}
          followerRange={followerRange}
          setFollowerRange={(v) => {
            setFollowerRange(v);
            resetPage();
          }}
          maxBudget={maxBudget}
          setMaxBudget={(v) => {
            setMaxBudget(v);
            resetPage();
          }}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={(v) => {
            setVerifiedOnly(v);
            resetPage();
          }}
          sort={sort}
          setSort={(v) => {
            setSort(v);
            resetPage();
          }}
          resultCount={data?.pagination.total ?? 0}
          variant="dark"
        />

        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[560px] w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : !data?.data.length ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
              <Users2 className="h-9 w-9 text-[#71717A]" />
              <p className="text-sm text-[#A1A1AA]">No influencers found. Try a different search or filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.data.map((influencer) => (
                  <InfluencerCard key={influencer._id} influencer={influencer} variant="dark" />
                ))}
              </div>
              <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
