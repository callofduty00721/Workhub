import { useQueries, useQuery } from "@tanstack/react-query";
import { startupApi } from "@/api/startups";
import { investmentApi } from "@/api/investments";
import type { Investment } from "@/types";

export interface FounderInvestment extends Investment {
  startupName: string;
}

export function useFounderInvestments({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: myStartups, isLoading: isLoadingStartups } = useQuery({
    queryKey: ["startups", "mine"],
    queryFn: startupApi.mine,
    enabled,
  });

  const results = useQueries({
    queries: (myStartups ?? []).map((s) => ({
      queryKey: ["startups", s._id, "investments"],
      queryFn: () => investmentApi.list(s._id),
      enabled: enabled && !!myStartups,
    })),
  });

  const isLoading = isLoadingStartups || results.some((r) => r.isLoading);

  const investments: FounderInvestment[] = (myStartups ?? []).flatMap((s, i) => {
    const items = results[i]?.data ?? [];
    return items.map((inv) => ({ ...inv, startupName: s.name }));
  });

  investments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = investments.filter((inv) => inv.status === "pending").length;

  return { investments, isLoading, pendingCount };
}
