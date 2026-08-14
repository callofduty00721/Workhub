import { lazy, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicSettingsApi } from "@/api/settings";
import { PageLoader } from "@/components/shared/PageLoader";

const NotFound = lazy(() => import("@/pages/NotFound"));

// Wraps the /jobs, /jobs/:id route elements — renders the real page only
// while the admin-controlled kill-switch (Platform Settings -> "Jobs
// Feature", see AdminSettings.tsx) is on, otherwise the same NotFound a
// visitor would see for any other unknown URL. Keeps App.tsx's route table
// itself static; the toggle only changes what each route renders.
export function JobsFeatureGate({ children }: { children: ReactNode }) {
  const { data: jobsEnabled, isLoading } = useQuery({
    queryKey: ["settings", "jobs-enabled"],
    queryFn: publicSettingsApi.jobsEnabled,
    staleTime: 60 * 1000,
  });

  if (isLoading) return <PageLoader />;
  return jobsEnabled ? <>{children}</> : <NotFound />;
}
