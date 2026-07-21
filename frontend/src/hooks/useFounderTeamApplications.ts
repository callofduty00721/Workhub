import { useQueries, useQuery } from "@tanstack/react-query";
import { startupApi } from "@/api/startups";
import { teamApplicationApi } from "@/api/teamApplications";
import type { TeamApplication } from "@/types";

export interface FounderTeamApplication extends TeamApplication {
  startupName: string;
}

export function useFounderTeamApplications({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: myStartups, isLoading: isLoadingStartups } = useQuery({
    queryKey: ["startups", "mine"],
    queryFn: startupApi.mine,
    enabled,
  });

  const results = useQueries({
    queries: (myStartups ?? []).map((s) => ({
      queryKey: ["startups", s._id, "team-applications"],
      queryFn: () => teamApplicationApi.list(s._id),
      enabled: enabled && !!myStartups,
    })),
  });

  const isLoading = isLoadingStartups || results.some((r) => r.isLoading);

  const applications: FounderTeamApplication[] = (myStartups ?? []).flatMap((s, i) => {
    const apps = results[i]?.data ?? [];
    return apps.map((a) => ({ ...a, startupName: s.name }));
  });

  applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return { applications, isLoading, pendingCount };
}
