import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Clock, Star, MessageSquare, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceApi } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function ServiceDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: service, isLoading } = useQuery({ queryKey: ["services", id], queryFn: () => serviceApi.getById(id), enabled: !!id });

  const freelancer = service && typeof service.freelancer === "object" ? service.freelancer : null;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(freelancer!._id),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createGigOrderPayment(id),
        verify: (payload) => paymentApi.verifyMarketplacePayment(payload),
        description: service!.title,
        prefill: { name: user!.name, email: user!.email },
        onSuccess: () => setOrdered(true),
      });
    },
    onError: (err) => setOrderError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable"),
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Service not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/freelancers">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {service.images && service.images.length > 0 ? (
            <div className="space-y-2">
              <div className="h-56 overflow-hidden rounded-xl sm:h-80">
                <img src={service.images[activeImage]} alt={service.title} className="h-full w-full object-cover" />
              </div>
              {service.images.length > 1 && (
                <div className="flex gap-2">
                  {service.images.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-primary" : "border-transparent"}`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5">
              <span className="text-5xl font-bold text-primary/30">{service.title[0]}</span>
            </div>
          )}

          <div>
            <Badge variant="secondary" className="mb-2">
              {service.category}
            </Badge>
            <h1 className="text-2xl font-bold">{service.title}</h1>
            {freelancer && (
              <Link to={`/freelancers/${freelancer._id}`} className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[10px] font-semibold text-white">
                  {freelancer.name[0]}
                </div>
                by {freelancer.name}
              </Link>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-2 text-base font-semibold">About This Service</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{service.description}</p>
              {service.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {service.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ReviewsSection targetType="service" targetId={service._id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Starting at</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(service.price)}
                  {service.priceType === "hourly" && <span className="text-sm font-normal text-muted-foreground">/hr</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {service.deliveryDays}-day delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-warning text-warning" /> {service.rating || "New"} ({service.reviewCount} reviews)
              </div>
              {ordered ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> Order Placed
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="gradient"
                  disabled={!user || user.id === freelancer?._id || orderMutation.isPending}
                  onClick={() => (user ? orderMutation.mutate() : navigate("/login"))}
                >
                  {orderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Order Now
                </Button>
              )}
              {orderError && <p className="text-xs text-danger">{orderError}</p>}
              <Button
                className="w-full"
                variant="outline"
                disabled={!user || messageMutation.isPending}
                onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              >
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Contact Freelancer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
