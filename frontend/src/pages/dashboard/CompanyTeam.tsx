import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Building2, Plus, Trash2, Loader2, Crown, UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { companyApi } from "@/api/companies";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName } from "@/lib/utils";

export default function CompanyTeam() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sidebarRole: DashboardRole =
    user?.role === "client" ? "client" : user?.role === "freelancer" ? "freelancer" : "employer";
  const postingType = sidebarRole === "client" ? "project" : sidebarRole === "freelancer" ? "gig" : "job";
  const postingTypePlural = sidebarRole === "freelancer" ? "gigs" : `${postingType} postings`;
  const roleLabel = sidebarRole === "client" ? "Client" : sidebarRole === "freelancer" ? "Freelancer" : "Employer";

  const { data: company, isLoading } = useQuery({ queryKey: ["companies", "mine"], queryFn: companyApi.mine });

  const createMutation = useMutation({
    mutationFn: () => companyApi.create(companyName.trim()),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] });
      await refreshUser();
      setCompanyName("");
    },
    onError: (err) => setError(isAxiosError(err) ? err.response?.data?.message || "Failed to create company" : "Something went wrong"),
  });

  const inviteMutation = useMutation({
    mutationFn: () => companyApi.invite(inviteEmail.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] });
      setInviteEmail("");
      setError(null);
    },
    onError: (err) => setError(isAxiosError(err) ? err.response?.data?.message || "Failed to invite member" : "Something went wrong"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => companyApi.removeMember(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companies", "mine"] }),
  });

  if (isLoading) {
    return (
      <DashboardLayout role={sidebarRole} title="Company Team" subtitle={`Manage your company and teammates who can jointly manage ${postingTypePlural}.`}>
        <Skeleton className="h-56 w-full" />
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout role={sidebarRole} title="Company Team" subtitle={`Set up a company so teammates can jointly manage your ${postingTypePlural}.`}>
        <Card className="max-w-lg">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">Create Your Company</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Once created, you can invite other {roleLabel} accounts to join as teammates — they'll be able to jointly manage every
              {sidebarRole === "freelancer" ? " gig" : ` ${postingType}`} under this company{sidebarRole === "freelancer" ? "" : " and its applicants"}.
            </p>
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. TechNova Solutions" />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button variant="gradient" disabled={!companyName.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={sidebarRole} title={company.name} subtitle={`Teammates here can jointly manage all of this company's ${postingTypePlural}.`}>
      <Card className="mb-6">
        <CardContent className="space-y-3 p-6">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <UserPlus className="h-4 w-4" /> Invite a Teammate
          </h3>
          <p className="text-xs text-muted-foreground">
            Enter the email of an existing {roleLabel} account (not yet part of a company) to add them.
          </p>
          <div className="flex gap-2">
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com" className="max-w-xs" />
            <Button variant="gradient" size="sm" disabled={!inviteEmail.trim() || inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
              {inviteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Invite
            </Button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold">Team Members</h3>
          <div className="space-y-3">
            {company.members.map((m) => (
              <div key={m.user._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.user.avatar} alt={m.user.name} />
                    <AvatarFallback>{initialsFromName(m.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {m.user.name}
                      {m.user._id === company.owner && <Crown className="h-3.5 w-3.5 text-warning" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.role === "admin" ? "secondary" : "outline"} className="capitalize">
                    {m.user._id === company.owner ? "Owner" : m.role}
                  </Badge>
                  {m.user._id !== company.owner && m.user._id !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-danger hover:bg-danger/10"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(m.user._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
