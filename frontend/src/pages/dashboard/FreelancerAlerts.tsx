import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Bell, Plus, Trash2, Wifi, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { alertApi } from "@/api/alerts";

export default function FreelancerAlerts() {
  const [keywordsInput, setKeywordsInput] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({ queryKey: ["alerts", "mine"], queryFn: alertApi.mine });

  const createMutation = useMutation({
    mutationFn: () =>
      alertApi.create({
        keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
        remoteOnly,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "mine"] });
      setKeywordsInput("");
      setRemoteOnly(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => alertApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", "mine"] }),
  });

  return (
    <DashboardLayout role="freelancer" title="Job Alerts" subtitle="Get notified the moment a new job or project matches your skills.">
      <Card className="mb-6">
        <CardContent className="space-y-4 p-6">
          <h3 className="text-base font-semibold">Create a New Alert</h3>
          <div className="space-y-2">
            <Label>Keywords or Skills (comma separated)</Label>
            <Input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="React, Node.js, Logo Design"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-border" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
            Remote jobs only
          </label>
          {createMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(createMutation.error) ? createMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            variant="gradient"
            size="sm"
            disabled={!keywordsInput.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create Alert
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold">Your Alerts</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !alerts?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No alerts yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">Create one above to get notified about matching jobs and projects.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {alert.keywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-[10px]">
                        {kw}
                      </Badge>
                    ))}
                    {alert.remoteOnly && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                        <Wifi className="h-3 w-3" /> Remote only
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(alert._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
