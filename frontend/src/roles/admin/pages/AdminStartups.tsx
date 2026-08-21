import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ShieldCheck, ShieldOff, UserCheck, UserX, FileText, Check, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminApi } from "@/api/admin";
import { initialsFromName } from "@/lib/utils";

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

function VerificationRequestsQueue() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin", "verification-requests"],
    queryFn: () => adminApi.verificationRequests(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ startupId, requestId, action }: { startupId: string; requestId: string; action: "approve" | "reject" }) =>
      adminApi.reviewVerificationRequest(startupId, requestId, action, action === "reject" ? reviewNote : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verification-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "startups"] });
      setRejectingId(null);
      setReviewNote("");
    },
  });

  if (isLoading || !requests?.length) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <h3 className="mb-1 text-base font-semibold">Pending Verification Requests ({requests.length})</h3>
        <p className="mb-4 text-xs text-muted-foreground">Founder-submitted evidence awaiting manual review.</p>
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={req.founder?.avatar} alt={req.founder?.name} />
                    <AvatarFallback className="text-xs">{req.founder ? initialsFromName(req.founder.name) : "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {req.founder?.name ?? "Unknown"} · <span className="text-muted-foreground">{req.startupName}</span>
                    </p>
                    <Badge variant="outline" className="mt-0.5 capitalize">
                      {req.type} verification
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-success hover:bg-success/10"
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ startupId: req.startupId, requestId: req._id, action: "approve" })}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => setRejectingId(rejectingId === req._id ? null : req._id)}
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {req.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-primary hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> {doc.name}
                  </a>
                ))}
              </div>
              {req.note && <p className="mt-2 text-xs text-muted-foreground">Note: {req.note}</p>}

              {rejectingId === req._id && (
                <div className="mt-3 flex gap-2">
                  <Input
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Reason for rejection (shown to the founder)"
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ startupId: req.startupId, requestId: req._id, action: "reject" })}
                  >
                    Confirm Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminStartups() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "startups", { search, page }],
    queryFn: () => adminApi.startups({ search: search || undefined, page, limit: 20 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "startups"] });

  const founderVerifyMutation = useMutation({
    mutationFn: (startupId: string) => adminApi.toggleFounderVerified(startupId),
    onSuccess: invalidate,
  });

  const businessVerifyMutation = useMutation({
    mutationFn: (startupId: string) => adminApi.toggleBusinessVerified(startupId),
    onSuccess: invalidate,
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Manage Startups"
      subtitle="Founder Verified confirms the person is real (works for idea-stage too). Business Verified additionally confirms a registered business."
    >
      <VerificationRequestsQueue />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by startup name..."
          className="pl-9"
        />
      </div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Startup</th>
                <th className="px-5 py-3 font-medium">Founder</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Founder Verified</th>
                <th className="px-5 py-3 font-medium">Business Verified</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((s) => {
                const founder = typeof s.founder === "object" ? s.founder : null;
                return (
                  <tr key={s._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/startups/${s._id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{founder?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="capitalize">
                        {s.stage.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {s.founderVerified ? (
                          <Badge className="flex w-fit items-center gap-1 bg-primary/10 text-primary">
                            <UserCheck className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className={s.founderVerified ? "text-danger hover:bg-danger/10" : ""}
                          onClick={() => founderVerifyMutation.mutate(s._id)}
                          disabled={founderVerifyMutation.isPending}
                        >
                          {s.founderVerified ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {s.isVerified ? (
                          <Badge className="flex w-fit items-center gap-1 bg-primary/10 text-primary">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className={s.isVerified ? "text-danger hover:bg-danger/10" : ""}
                          onClick={() => businessVerifyMutation.mutate(s._id)}
                          disabled={businessVerifyMutation.isPending}
                        >
                          {s.isVerified ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      {!s.registrationNumber && !s.isVerified && (
                        <p className="mt-1 text-[10.5px] text-muted-foreground">No registration number provided</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      </motion.div>

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
