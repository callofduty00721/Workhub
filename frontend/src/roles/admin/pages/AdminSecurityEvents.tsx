import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import type { AdminSecurityEvent } from "@/api/admin";

const TYPE_OPTIONS = [
  { value: "all", label: "All event types" },
  { value: "login_success", label: "Login succeeded" },
  { value: "login_failed", label: "Login failed" },
  { value: "google_login_success", label: "Google login succeeded" },
  { value: "google_login_failed", label: "Google login failed" },
  { value: "register_success", label: "Registered" },
  { value: "password_reset_requested", label: "Password reset requested" },
  { value: "password_reset_completed", label: "Password reset completed" },
  { value: "password_changed", label: "Password changed" },
  { value: "account_deactivated", label: "Account deactivated" },
  { value: "role_switched", label: "Role switched" },
  { value: "roles_added", label: "Roles added" },
  { value: "category_selected", label: "Category selected" },
];

function typeBadge(type: string) {
  if (type.endsWith("_failed")) return <Badge variant="danger">{type.replace(/_/g, " ")}</Badge>;
  if (type === "account_deactivated") return <Badge variant="danger">{type.replace(/_/g, " ")}</Badge>;
  if (type.endsWith("_success") || type === "password_reset_completed") return <Badge variant="success">{type.replace(/_/g, " ")}</Badge>;
  if (type.startsWith("password_")) return <Badge variant="warning">{type.replace(/_/g, " ")}</Badge>;
  return <Badge variant="outline">{type.replace(/_/g, " ")}</Badge>;
}

export default function AdminSecurityEvents() {
  const [email, setEmail] = useState("");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security-events", { email, type, startDate, endDate, page }],
    queryFn: () =>
      adminApi.securityEvents({
        email: email || undefined,
        type: type === "all" ? undefined : type,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 50,
      }),
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Security Events"
      subtitle="Login attempts, password changes, and role changes — the forensic trail for investigating a suspected account takeover."
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={email}
            onChange={(e) => {
              setPage(1);
              setEmail(e.target.value);
            }}
            placeholder="Filter by email..."
            className="pl-9"
          />
        </div>
        <Select
          value={type}
          onValueChange={(v) => {
            setPage(1);
            setType(v);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setPage(1);
            setStartDate(e.target.value);
          }}
          max={endDate || new Date().toISOString().slice(0, 10)}
          className="w-40"
          aria-label="From date"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setPage(1);
            setEndDate(e.target.value);
          }}
          min={startDate || undefined}
          max={new Date().toISOString().slice(0, 10)}
          className="w-40"
          aria-label="To date"
        />
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPage(1);
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear dates
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">No security events match these filters</p>
          </div>
        ) : (
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 font-medium">IP</th>
                <th className="px-5 py-3 font-medium">User Agent</th>
                <th className="px-5 py-3 font-medium">Detail</th>
                <th className="px-5 py-3 font-medium text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((ev: AdminSecurityEvent) => (
                <tr key={ev._id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">{typeBadge(ev.type)}</td>
                  <td className="px-5 py-3">
                    {ev.user ? (
                      <>
                        <p className="truncate font-medium">{ev.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{ev.user.email}</p>
                      </>
                    ) : (
                      <p className="truncate text-muted-foreground">{ev.email || "—"}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{ev.ip || "—"}</td>
                  <td className="max-w-[220px] truncate px-5 py-3 text-muted-foreground" title={ev.userAgent}>
                    {ev.userAgent || "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{ev.detail || "—"}</td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
