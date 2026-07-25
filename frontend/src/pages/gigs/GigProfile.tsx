import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Clock, Star, MessageSquare, CreditCard, CheckCircle2, Loader2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceApi } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { PortfolioGrid } from "@/components/shared/PortfolioGrid";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { PackageName } from "@/types";

export default function GigProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: service, isLoading } = useQuery({ queryKey: ["services", id], queryFn: () => serviceApi.getById(id), enabled: !!id });

  const freelancer = service && typeof service.freelancer === "object" ? service.freelancer : null;

  const [selectedPackage, setSelectedPackage] = useState<PackageName | null>(null);

  useEffect(() => {
    if (service?.packages?.length) setSelectedPackage(service.packages[0].name);
  }, [service]);

  const activePackage = service?.packages?.find((p) => p.name === selectedPackage);
  const displayPrice = activePackage?.price ?? service?.price ?? 0;
  const displayDeliveryDays = activePackage?.deliveryDays ?? service?.deliveryDays ?? 0;
  const displayRevisions = activePackage?.revisions ?? service?.revisions;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(freelancer!._id),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createGigOrderPayment(id, { packageName: selectedPackage ?? undefined }),
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
              <div className="group relative h-56 overflow-hidden rounded-xl sm:h-80">
                <img src={service.images[activeImage]} alt={service.title} className="h-full w-full object-cover" />
                {service.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const images = service.images!;
                        setActiveImage((i) => (i - 1 + images.length) % images.length);
                      }}
                      className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 group-hover:flex"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const images = service.images!;
                        setActiveImage((i) => (i + 1) % images.length);
                      }}
                      className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 group-hover:flex"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
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

          {service.video && (
            <video src={service.video} controls className="max-h-96 w-full rounded-xl border border-border" />
          )}

          <div>
            <Badge variant="secondary" className="mb-2">
              {service.category}
            </Badge>
            <h1 className="text-2xl font-bold">{service.title}</h1>
            {freelancer && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Link to={`/freelancers/${freelancer._id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[10px] font-semibold text-white">
                    {freelancer.name[0]}
                  </div>
                  by {freelancer.name}
                </Link>
                {typeof service?.company === "object" && service.company?.name && (
                  <Badge variant="outline" className="text-[10px]">
                    {service.company.name}
                  </Badge>
                )}
              </div>
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

          {!!freelancer?.portfolioItems?.length && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Portfolio ({freelancer.portfolioItems.length})</h3>
                <PortfolioGrid items={freelancer.portfolioItems} />
              </CardContent>
            </Card>
          )}

          <ReviewsSection targetType="service" targetId={service._id} />
        </div>

        <div className="space-y-6">
          {service.packages && service.packages.length > 0 && (
            <div className="flex rounded-lg border border-border p-1">
              {service.packages.map((pkg) => (
                <button
                  key={pkg.name}
                  type="button"
                  onClick={() => setSelectedPackage(pkg.name)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                    selectedPackage === pkg.name ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pkg.name}
                </button>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">{activePackage ? activePackage.title || "Price" : "Starting at"}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(displayPrice)}
                  {!activePackage && service.priceType === "hourly" && <span className="text-sm font-normal text-muted-foreground">/hr</span>}
                </p>
                {activePackage?.description && <p className="mt-1 text-xs text-muted-foreground">{activePackage.description}</p>}
              </div>
              {activePackage?.features && activePackage.features.length > 0 && (
                <ul className="space-y-1.5">
                  {activePackage.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {displayDeliveryDays}-day delivery
              </div>
              {!!displayRevisions && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RotateCcw className="h-4 w-4" />
                  {displayRevisions === -1 ? "Unlimited revisions" : `${displayRevisions} revision${displayRevisions === 1 ? "" : "s"}`}
                </div>
              )}
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
