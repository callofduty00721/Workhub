import { Link } from "react-router-dom";
import { Building2, ShieldCheck, Send, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DirectoryList } from "@/components/shared/DirectoryList";
import { partnerApi } from "@/api/partners";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  accelerator: "Accelerator",
  incubator: "Incubator",
  government: "Government",
  ngo: "NGO",
  service_provider: "Service Provider",
};

// Real platform capabilities — no fabricated numbers.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified organizations", color: "text-green-500" },
  { icon: Send, label: "Direct outreach", color: "text-blue-500" },
  { icon: FileText, label: "Real programs", color: "text-purple-500" },
];

export default function PartnerList() {
  return (
    <DirectoryList
      title="Partners & Accelerators"
      subtitle="Accelerators, incubators, government bodies, NGOs and service providers."
      searchPlaceholder="Search partners..."
      emptyIcon={Building2}
      emptyMessage="No partners found."
      queryKey="partners"
      queryFn={partnerApi.list}
      getItemKey={(partner) => partner._id}
      skeletonClassName="h-40"
      hero={{
        badgeIcon: Building2,
        badgeText: (total) => (total > 0 ? `${total.toLocaleString()} partner${total === 1 ? "" : "s"} listed` : "Browse partners"),
        heroTitle: "Find the right",
        accent: "partner",
        trustPoints: TRUST_POINTS,
      }}
      renderCard={(partner) => (
        <Link to={`/partners/${partner._id}`}>
          <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              {(partner.organizationName || partner.name)[0]}
            </div>
            <p className="text-sm font-semibold">{partner.organizationName || partner.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{partner.name}</p>
            <Badge variant="outline" className="mt-3 w-fit text-[10px]">
              {PARTNER_TYPE_LABELS[partner.partnerType]}
            </Badge>
          </Card>
        </Link>
      )}
    />
  );
}
