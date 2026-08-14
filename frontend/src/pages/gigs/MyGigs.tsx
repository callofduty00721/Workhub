import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Rocket, Pencil, Trash2, Star, Eye, ImageOff } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { serviceApi } from "@/api/freelancers";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatCompactNumber, initialsFromName } from "@/lib/utils";

export default function MyGigs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: services, isLoading } = useQuery({ queryKey: ["services", "mine"], queryFn: serviceApi.mine });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services", "mine"] }),
  });

  return (
    <DashboardLayout
      role="freelancer"
      title="My Gigs"
      subtitle="Manage the services you offer on GrowHive."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/freelancer/gigs/new">
            <Plus className="h-4 w-4" /> Create New Gig
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : !services?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Rocket className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm font-medium">You haven&apos;t created any gigs yet</p>
            <Button variant="gradient" asChild size="sm" className="mt-1">
              <Link to="/dashboard/freelancer/gigs/new">Create Your First Gig</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const postedBy = typeof service.freelancer === "object" ? service.freelancer : null;
            const isTeammateGig = !!postedBy && postedBy._id !== user?.id;
            return (
            <Card key={service._id} className="flex flex-col overflow-hidden p-0">
              <div className="flex h-32 w-full items-center justify-center bg-muted">
                {service.images?.[0] ? (
                  <img src={service.images[0]} alt={service.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {service.category}
                  </Badge>
                  <Badge
                    variant={service.status === "active" ? "success" : service.status === "draft" ? "warning" : "outline"}
                    className="text-[10px] capitalize"
                  >
                    {service.status}
                  </Badge>
                </div>
                {isTeammateGig && postedBy && (
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={postedBy.avatar} alt={postedBy.name} />
                      <AvatarFallback className="text-[8px]">{initialsFromName(postedBy.name)}</AvatarFallback>
                    </Avatar>
                    Posted by {postedBy.name}
                  </div>
                )}
                <p className="mb-3 line-clamp-2 flex-1 text-sm font-medium">{service.title}</p>
                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-3">
                    <span>{service.ordersCount} orders</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" /> {service.rating > 0 ? service.rating.toFixed(1) : "New"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {formatCompactNumber(service.viewsCount)}
                    </span>
                  </span>
                  <span className="font-semibold text-foreground">{formatCurrency(service.price)}</span>
                </div>
                <div className="flex gap-2 border-t border-border pt-3">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/dashboard/freelancer/gigs/${service._id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => deleteMutation.mutate(service._id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
