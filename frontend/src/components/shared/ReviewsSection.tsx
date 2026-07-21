import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { reviewApi } from "@/api/reviews";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName } from "@/lib/utils";
import type { Review } from "@/types";

export function ReviewsSection({ targetType, targetId }: { targetType: Review["targetType"]; targetId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", targetType, targetId],
    queryFn: () => reviewApi.list(targetType, targetId),
    enabled: !!targetId,
  });

  const alreadyReviewed = reviews?.some((r) => r.reviewer._id === user?.id);

  const mutation = useMutation({
    mutationFn: () => reviewApi.create({ targetType, targetId, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", targetType, targetId] });
      setRating(0);
      setComment("");
    },
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 text-base font-semibold">Reviews {reviews?.length ? `(${reviews.length})` : ""}</h3>

        {user && !alreadyReviewed && targetId !== user.id && (
          <div className="mb-6 space-y-3 rounded-lg border border-border p-4">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="min-h-[80px]" />
            {mutation.isError && (
              <p className="text-xs text-danger">
                {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}
              </p>
            )}
            <Button size="sm" variant="gradient" disabled={rating === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit Review
            </Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        ) : !reviews?.length ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="flex gap-3 border-t border-border pt-4 first:border-0 first:pt-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={review.reviewer.avatar} />
                  <AvatarFallback className="text-xs">{initialsFromName(review.reviewer.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{review.reviewer.name}</p>
                    <StarRating value={review.rating} />
                  </div>
                  {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
