import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, MessageSquareWarning } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminApi } from "@/api/admin";
import { reviewApi } from "@/api/reviews";
import { initialsFromName } from "@/lib/utils";
import type { AdminReviewRow } from "@/api/admin";

const TARGET_TYPE_OPTIONS = [
  { value: "all", label: "All targets" },
  { value: "user", label: "Freelancer/User" },
  { value: "service", label: "Gig" },
  { value: "startup", label: "Startup" },
];

const RATING_OPTIONS = [
  { value: "all", label: "Any rating" },
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [targetType, setTargetType] = useState("all");
  const [rating, setRating] = useState("all");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<AdminReviewRow | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews", { targetType, rating, page }],
    queryFn: () =>
      adminApi.reviews({
        targetType: targetType === "all" ? undefined : targetType,
        rating: rating === "all" ? undefined : Number(rating),
        page,
        limit: 20,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      setDeleting(null);
    },
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Reviews"
      subtitle="Every rating and comment left across the platform — freelancers, gigs, and startups."
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <Select
          value={targetType}
          onValueChange={(v) => {
            setPage(1);
            setTargetType(v);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TARGET_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={rating}
          onValueChange={(v) => {
            setPage(1);
            setRating(v);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <MessageSquareWarning className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">No reviews match these filters</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.data.map((review) => (
            <Card key={review._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={review.reviewer.avatar} alt={review.reviewer.name} />
                    <AvatarFallback className="text-[11px]">{initialsFromName(review.reviewer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{review.reviewer.name}</p>
                      <Stars rating={review.rating} />
                    </div>
                    <p className="text-xs text-muted-foreground">{review.reviewer.email}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        {review.targetType}
                      </Badge>
                      {review.targetLabel ?? "Unknown / deleted"}
                    </p>
                    {review.comment && <p className="mt-2 max-w-xl text-sm text-foreground">{review.comment}</p>}
                    <p className="mt-1.5 text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10" onClick={() => setDeleting(review)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

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

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this review?</DialogTitle>
            <DialogDescription>
              {deleting && (
                <>
                  {deleting.reviewer.name}'s {deleting.rating}-star review of {deleting.targetLabel ?? `this ${deleting.targetType}`} will
                  be permanently removed and the target's average rating recalculated. This can't be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            className="w-full"
            disabled={deleteMutation.isPending}
            onClick={() => deleting && deleteMutation.mutate(deleting._id)}
          >
            Delete Review
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
