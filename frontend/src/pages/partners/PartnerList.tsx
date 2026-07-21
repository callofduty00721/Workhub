import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { partnerApi } from "@/api/partners";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  accelerator: "Accelerator",
  incubator: "Incubator",
  government: "Government",
  ngo: "NGO",
  service_provider: "Service Provider",
};

export default function PartnerList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["partners", { search }],
    queryFn: () => partnerApi.list({ search: search || undefined, limit: 12 }),
  });

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Partners & Accelerators</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accelerators, incubators, government bodies, NGOs and service providers.</p>
      </div>

      <div className="relative mb-6 max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners..." className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Building2 className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No partners found.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.data.map((partner) => (
            <Link key={partner._id} to={`/partners/${partner._id}`}>
              <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                  {(partner.organizationName || partner.name)[0]}
                </div>
                <p className="text-sm font-semibold">{partner.organizationName || partner.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{partner.name}</p>
                <Badge variant="outline" className="mt-3 w-fit text-[10px]">
                  {PARTNER_TYPE_LABELS[partner.partnerType]}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
