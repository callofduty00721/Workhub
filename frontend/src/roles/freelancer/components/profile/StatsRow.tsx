// roles/freelancer/components/profile/StatsRow.tsx

import {
  Briefcase,
  CheckCircle2,
  Clock3,
  Star,
  Wallet,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsRowProps {
  stats: any;
  freelancer: any;
}

const items = (
  stats: any,
  freelancer: any
) => [
  {
    icon: Wallet,
    title: "Total Earnings",
    value: formatCurrency(stats.totalEarnings),
  },
  {
    icon: Briefcase,
    title: "Projects",
    value: stats.jobsCompleted,
  },
  {
    icon: Star,
    title: "Rating",
    value: freelancer.rating || "New",
  },
  {
    icon: CheckCircle2,
    title: "Job Success",
    value: `${stats.jobSuccessPercent}%`,
  },
  {
    icon: Clock3,
    title: "Response",
    value: freelancer.responseTimeLabel || "< 1 hr",
  },
  {
    icon: Users,
    title: "Followers",
    value: freelancer.followersCount || 0,
  },
];

export default function StatsRow({
  stats,
  freelancer,
}: StatsRowProps) {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">

      {items(stats, freelancer).map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className="
              rounded-[24px]
              border-slate-200
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-lg
            "
          >
            <CardContent className="p-6">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">

                <Icon className="h-6 w-6 text-blue-600" />

              </div>

              <p className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                {item.value}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {item.title}
              </p>

            </CardContent>
          </Card>
        );
      })}

    </section>
  );
}