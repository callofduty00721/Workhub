import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, KeyRound, Bell, AlertTriangle, UserCog } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi } from "@/api/auth";
import { userApi } from "@/api/users";
import { setAccessToken } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_LABELS, CATEGORY_ROLES, ROLE_LABELS } from "@/lib/roles";

const DASHBOARD_ROLES: DashboardRole[] = [
  "founder",
  "freelancer",
  "job_seeker",
  "influencer",
  "employer",
  "super_admin",
  "investor",
  "mentor",
  "partner",
  "client",
];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const sidebarRole: DashboardRole = DASHBOARD_ROLES.includes(user?.role as DashboardRole) ? (user!.role as DashboardRole) : "founder";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotificationsEnabled ?? true);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: (res) => {
      setAccessToken(res.accessToken);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setPasswordSuccess(true);
    },
    onError: (err) =>
      setPasswordError(isAxiosError(err) ? err.response?.data?.message || "Failed to change password" : "Something went wrong"),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordError(null);
    passwordMutation.mutate();
  };

  const notificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => userApi.updateNotificationPreferences(enabled),
    onSuccess: () => refreshUser(),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => authApi.deactivateAccount(deactivatePassword || undefined),
    onSuccess: async () => {
      await logout();
      navigate("/");
    },
    onError: (err) =>
      setDeactivateError(isAxiosError(err) ? err.response?.data?.message || "Failed to deactivate account" : "Something went wrong"),
  });

  if (!user) return null;

  return (
    <DashboardLayout role={sidebarRole} title="Account Settings" subtitle="Manage your password, notifications, and account.">
      <div className="space-y-6">
        {user.selectedCategory && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <UserCog className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-base font-semibold">Your Roles</h3>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium">{CATEGORY_LABELS[user.selectedCategory]}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(user.roles ?? []).map((role) => (
                  <Badge key={role} variant={role === user.role ? "default" : "outline"}>
                    {ROLE_LABELS[role]}
                    {role === user.role && " (active)"}
                  </Badge>
                ))}
              </div>
              {(user.roles?.length ?? 0) < CATEGORY_ROLES[user.selectedCategory].length && (
                <Button variant="outline" size="sm" onClick={() => navigate("/onboarding/roles")}>
                  Add another role
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">
                Roles are switched from your profile menu in the navbar. Picking a different category resets your
                current roles — do that only if you're changing what you use MahaHub for.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-base font-semibold">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-success">Password changed successfully.</p>}
              <Button type="submit" disabled={!currentPassword || !newPassword || passwordMutation.isPending}>
                {passwordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-base font-semibold">Notification Preferences</h3>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3.5">
              <span>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Get emailed about messages, application updates, payments, and reviews.</p>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 rounded border-border"
                checked={emailNotifications}
                disabled={notificationsMutation.isPending}
                onChange={(e) => {
                  setEmailNotifications(e.target.checked);
                  notificationsMutation.mutate(e.target.checked);
                }}
              />
            </label>
          </CardContent>
        </Card>

        <Card className="border-danger/30">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-danger" />
              <h3 className="text-base font-semibold text-danger">Deactivate Account</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll be logged out and won't be able to log back in until support reactivates your account. This does not delete your
              data.
            </p>
            {!deactivateOpen ? (
              <Button type="button" variant="outline" className="text-danger hover:bg-danger/10" onClick={() => setDeactivateOpen(true)}>
                Deactivate Account
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border border-danger/30 p-4">
                <div className="space-y-2">
                  <Label htmlFor="deactivatePassword">Enter your password to confirm</Label>
                  <Input
                    id="deactivatePassword"
                    type="password"
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                  />
                </div>
                {deactivateError && <p className="text-xs text-danger">{deactivateError}</p>}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-danger hover:bg-danger/10"
                    disabled={deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate()}
                  >
                    {deactivateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Deactivation
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setDeactivateOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
