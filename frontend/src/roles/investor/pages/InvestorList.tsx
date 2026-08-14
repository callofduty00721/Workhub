import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users2, ShieldCheck, MessageSquare, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleHero } from "@/components/shared/SimpleHero";
import { InvestorCard } from "@/roles/investor/components/InvestorCard";
import { investorApi } from "@/api/investors";

// Real platform capabilities — no fabricated numbers.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified profiles", color: "text-green-500" },
  { icon: MessageSquare, label: "Direct messaging", color: "text-blue-500" },
  { icon: Wallet, label: "Transparent ticket sizes", color: "text-purple-500" },
];

export default function InvestorList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["investors", { search }],
    queryFn: () => investorApi.list({ search: search || undefined, limit: 12 }),
  });

  const total = data?.pagination.total ?? 0;

  return (
    <div>
      <SimpleHero
        badgeIcon={Users2}
        badgeText={total > 0 ? `${total.toLocaleString()} investor${total === 1 ? "" : "s"} to connect with` : "Browse investors"}
        title="Connect with"
        accent="investors"
        description="Connect with investors actively looking for their next opportunity."
        trustPoints={TRUST_POINTS}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search investors..."
      />

      <div className="container border-t border-border py-10">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <Users2 className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No investors found.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.map((investor) => (
              <InvestorCard key={investor._id} investor={investor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
