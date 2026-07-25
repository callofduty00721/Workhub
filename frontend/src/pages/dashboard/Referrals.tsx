import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Copy, Check, Users2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { userApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";

const DASHBOARD_ROLES: DashboardRole[] = ["founder", "freelancer", "employer", "super_admin", "investor", "mentor", "partner", "client"];

export default function Referrals() {
  const { user } = useAuth();
  const sidebarRole: DashboardRole = DASHBOARD_ROLES.includes(user?.role as DashboardRole) ? (user!.role as DashboardRole) : "freelancer";
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["users", "me", "referrals"], queryFn: userApi.getMyReferrals });

  const referralLink = data ? `${window.location.origin}/register?ref=${data.referralCode}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout
      role={sidebarRole}
      title="Referrals"
      subtitle="Invite people to MahaHub — earn a bonus when they complete their first paid job."
    >
      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Gift className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Bonus Credit</p>
                  <p className="text-lg font-bold">{formatCurrency(data?.referralBonusBalance ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  <Gift className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="text-lg font-bold">{formatCurrency(data?.referralBonusTotal ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <Users2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">People Referred</p>
                  <p className="text-lg font-bold">{data?.referredUsers.length ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-2 text-sm font-semibold">Your Referral Link</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Share this link — anyone who signs up through it gets linked to you. You earn a bonus the first time they complete a paid job as a
                freelancer.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 text-sm">{referralLink}</div>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Referral code: <span className="font-mono font-semibold text-foreground">{data?.referralCode}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">People You've Referred {data?.referredUsers.length ? `(${data.referredUsers.length})` : ""}</h3>
              {!data?.referredUsers.length ? (
                <p className="text-sm text-muted-foreground">No one yet — share your link to start earning referral credit.</p>
              ) : (
                <div className="space-y-3">
                  {data.referredUsers.map((r) => (
                    <div key={r._id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.avatar} alt={r.name} />
                          <AvatarFallback className="text-xs">{initialsFromName(r.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {r.role} · Joined {new Date(r.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={r.bonusCredited ? "success" : "outline"}>{r.bonusCredited ? "Bonus Credited" : "Pending"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
