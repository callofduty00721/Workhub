import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Star,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Crown,
  Award,
  ClipboardList,
  Zap,
  MessageCircle,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { HorizontalSlider } from "@/components/shared/HorizontalSlider";
import { serviceApi } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { formatCurrency, initialsFromName, cn } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { getTechIcon } from "@/lib/techIcons";
import { useAuth } from "@/context/AuthContext";
import type { PackageName } from "@/types";

// The gig video field stores a pasted YouTube/Vimeo link, not an uploaded
// file — this resolves it to an embeddable iframe URL. Returns null for a
// direct video file URL (e.g. one saved before this field became link-only),
// which falls back to a plain <video> tag.
const DESCRIPTION_PREVIEW_LENGTH = 320;

function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function GigProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [comparePackages, setComparePackages] = useState(false);
  const [extrasVisible, setExtrasVisible] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});

  const { data: service, isLoading } = useQuery({ queryKey: ["services", id], queryFn: () => serviceApi.getById(id), enabled: !!id });

  const freelancer = service && typeof service.freelancer === "object" ? service.freelancer : null;

  const [selectedPackage, setSelectedPackage] = useState<PackageName | null>(null);

  useEffect(() => {
    if (service?.packages?.length) setSelectedPackage(service.packages[0].name);
  }, [service]);

  const activePackage = service?.packages?.find((p) => p.name === selectedPackage);
  const displayPrice = activePackage?.price ?? service?.price ?? 0;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(freelancer!._id),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const selectedExtras = Object.entries(extraQuantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([label, quantity]) => ({ label, quantity }));

  const orderMutation = useMutation({
    mutationFn: async () => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createGigOrderPayment(id, { packageName: selectedPackage ?? undefined, extras: selectedExtras }),
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

  const hasPackages = !!service.packages && service.packages.length > 0;
  const hasExtras = !!service.extras?.length;
  const allPackageFeatures = hasPackages ? Array.from(new Set(service.packages!.flatMap((p) => p.features ?? []))) : [];

  const extrasTotal = service.extras?.reduce((sum, extra) => sum + extra.price * (extraQuantities[extra.label] ?? 0), 0) ?? 0;
  const totalPrice = displayPrice + extrasTotal;

  const trustBadges = [
    freelancer?.level === "top_rated" && {
      key: "top_rated",
      icon: Crown,
      color: "bg-[#F3F0FF] text-[#5B3DF5]",
      title: "Top Rated Seller",
      subtitle: "Consistently amazing work with 100% success.",
    },
    freelancer?.onTimeDeliveryPercent !== undefined && {
      key: "on_time",
      icon: Zap,
      color: "bg-blue-50 text-blue-600",
      title: `${freelancer.onTimeDeliveryPercent}% On-Time Delivery`,
      subtitle: "Consistently delivers on time.",
    },
    {
      key: "communication",
      icon: MessageCircle,
      color: "bg-success/10 text-success",
      title: "Great Communication",
      subtitle: "Quick & friendly responses throughout the project.",
    },
    { 
      key: "satisfaction", 
      icon: Heart, 
      color: "bg-pink-50 text-pink-600", 
      title: "100% Satisfaction", 
      subtitle: "Client satisfaction is a top priority." 
    },
    {
      key: "Response Time",
      icon: ShieldCheck,
      color: "bg-[#F3F0FF] text-[#5B3DF5]",
      title: "Response Time",
      subtitle: freelancer?.responseTimeLabel ? `Responds in ${freelancer.responseTimeLabel.toLowerCase()}` : "Responds quickly to messages",
    }
  ].filter(Boolean) as { key: string; icon: typeof Crown; color: string; title: string; subtitle: string }[];

  return (
    <div className="container py-10">
      <style>{`
        .gig-layout { grid-template-areas: "gallery" "sidebar" "about"; }
        .gig-layout > .gig-gallery { grid-area: gallery; }
        .gig-layout > .gig-sidebar { grid-area: sidebar; }
        .gig-layout > .gig-about { grid-area: about; }
        @media (min-width: 1024px) {
          .gig-layout { grid-template-columns: 1fr 400px; grid-template-areas: "gallery sidebar" "about sidebar"; }
        }
      `}</style>
      <Link to="/freelancers" className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketplace
      </Link>
      <div className="gig-layout grid items-start gap-6">
        {/* Media gallery */}
        <div className="gig-gallery min-w-0">
        <div className="flex flex-col gap-3">
          <div className="relative h-[224px] sm:h-[420px] lg:h-[480px]">
            {service.images && service.images.length > 0 ? (
              <div className="group relative h-full overflow-hidden rounded-xl bg-muted">
                <img src={service.images[activeImage]} alt={service.title} className="h-full w-full object-contain" />
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
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-gradient-to-br from-[#4C2FD6] to-[#5B3DF5]">
                <span className="text-5xl font-bold text-white/30">{service.title[0]}</span>
              </div>
            )}
            <SaveButton type="service" id={service._id} className="absolute right-3 top-3" />
            {service.liveDemoUrl && (
              <a
                href={service.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-[#5B3DF5] px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-[#4C2FD6]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Live Demo
              </a>
            )}
          </div>

          {service.images && service.images.length > 1 && (
            <div className="flex gap-2">
              {service.images.slice(0, 5).map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-[#5B3DF5]" : "border-transparent"}`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {service.images.length > 5 && (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground">
                  +{service.images.length - 5} More
                </div>
              )}
            </div>
          )}

          {service.video &&
            (getVideoEmbedUrl(service.video) ? (
              <iframe
                src={getVideoEmbedUrl(service.video)!}
                title="Gig video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full rounded-xl border border-border"
              />
            ) : (
              <video src={service.video} controls className="max-h-96 w-full rounded-xl border border-border" />
            ))}

        </div>
        </div>

        <div className="gig-about min-w-0 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F0FF] text-[#5B3DF5]">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <h3 className="text-base font-semibold">About This Gig</h3>
              </div>
              {(() => {
                const descriptionIsLong = service.description.length > DESCRIPTION_PREVIEW_LENGTH;
                const descriptionText =
                  !descriptionIsLong || descriptionExpanded
                    ? service.description
                    : `${service.description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`;
                return (
                  <>
                    <div
                      className="text-sm leading-relaxed text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: renderBioHtml(descriptionText) }}
                    />
                    {descriptionIsLong && (
                      <button
                        type="button"
                        onClick={() => setDescriptionExpanded((v) => !v)}
                        className="mt-1.5 text-xs font-medium text-[#5B3DF5] hover:underline"
                      >
                        {descriptionExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </>
                );
              })()}

              {/* {!!activePackage?.features?.length && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 text-sm font-semibold">What You Will Get:</p>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {activePackage.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )} */}

              {service.skills.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 text-sm font-semibold">Technologies I Use</p>
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((skill) => {
                      const tech = getTechIcon(skill);
                      return (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium"
                        >
                          {tech && <tech.icon className="h-3.5 w-3.5 shrink-0" style={{ color: tech.color }} />}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-4">
                {service.experienceLevel && (
                  <div>
                    <p className="text-muted-foreground">Experience Level</p>
                    <p className="font-medium capitalize">{service.experienceLevel}</p>
                  </div>
                )}
                {!!service.languages?.length && (
                  <div>
                    <p className="text-muted-foreground">Languages</p>
                    <p className="font-medium">{service.languages.join(", ")}</p>
                  </div>
                )}
                {freelancer?.jobsCompleted !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Projects Completed</p>
                    <p className="font-medium">{freelancer.jobsCompleted}+</p>
                  </div>
                )}
                {freelancer?.createdAt && (
                  <div>
                    <p className="text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(freelancer.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!!freelancer?.portfolioItems?.length && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">Portfolio ({freelancer.portfolioItems.length})</h3>
                  <Link
                    to={`/freelancers/${freelancer._id}`}
                    className="flex items-center gap-1 text-xs font-medium text-[#5B3DF5] hover:underline"
                  >
                    View All Portfolio <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <HorizontalSlider itemClassName="w-56">
                  {freelancer.portfolioItems.map((item, i) => (
                    <div key={i} className="overflow-hidden rounded-lg border border-border">
                      <div className="flex h-32 w-full items-center justify-center bg-muted">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground/30">{item.title[0]}</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-semibold">{item.title}</p>
                        {!!item.tags?.length && <p className="truncate text-[10px] text-muted-foreground">{item.tags.join(", ")}</p>}
                      </div>
                    </div>
                  ))}
                </HorizontalSlider>
              </CardContent>
            </Card>
          )}

          <ReviewsSection targetType="service" targetId={service._id} />
        </div>

        {/* Info + price panel */}
        <div className="gig-sidebar space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-[#5B3DF5]">
              <span>{service.category}</span>
              {service.subCategory && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>{service.subCategory}</span>
                </>
              )}
            </div>
            {service.ordersCount > 0 && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <ShoppingBag className="h-3.5 w-3.5" /> {service.ordersCount}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-snug">{service.title}</h1>

          {freelancer && (
            <div className="space-y-2.5">
              <Link to={`/freelancers/${freelancer._id}`} className="group flex items-center gap-2.5">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#4C2FD6] to-[#5B3DF5] text-xs font-semibold text-white">
                    {initialsFromName(freelancer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold group-hover:text-[#5B3DF5]">{freelancer.name}</span>
                    {freelancer.level === "top_rated" && (
                      <Badge className="gap-1 border-transparent bg-[#5B3DF5] text-[10px] text-white">
                        <Crown className="h-2.5 w-2.5" /> Top Rated
                      </Badge>
                    )}
                    {freelancer.level === "level_1" && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Award className="h-2.5 w-2.5" /> Level 1 Seller
                      </Badge>
                    )}
                  </div>
                  {(freelancer.headline || !!freelancer.yearsOfExperience) && (
                    <p className="text-xs text-muted-foreground">
                      {freelancer.headline}
                      {!!freelancer.headline && !!freelancer.yearsOfExperience && " | "}
                      {!!freelancer.yearsOfExperience && `${freelancer.yearsOfExperience}+ Years Experience`}
                    </p>
                  )}
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[1rem] text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {service.rating || "0.0"}
                  {service.reviewCount > 0 && ` (${service.reviewCount} reviews)`}
                </span>
                {freelancer.onTimeDeliveryPercent !== undefined && (
                  <span className="flex items-center gap-1 text-success">
                    <ShieldCheck className="h-3.5 w-3.5" /> {freelancer.onTimeDeliveryPercent}% On-Time Delivery
                  </span>
                )}
                {freelancer.responseTimeLabel && (
                  <span className="flex items-center gap-1 text-success">
                    <Clock className="h-3.5 w-3.5" /> Response Time: {freelancer.responseTimeLabel.toLowerCase()}
                  </span>
                )}
              </div>
              {typeof service?.company === "object" && service.company?.name && (
                <Badge variant="outline" className="ml-[1rem] text-[10px]">
                  {service.company.name}
                </Badge>
              )}
            </div>
          )}

          {freelancer?.availabilityStatus === "available" && (
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              <p className="flex items-center gap-2 font-medium">
                <span className="h-2 w-2 shrink-0 rounded-full bg-success" /> Available for new projects
              </p>
              {freelancer.responseTimeLabel && (
                <p className="mt-0.5 pl-4 text-xs text-success/80">Response In {freelancer.responseTimeLabel.toLowerCase()}</p>
              )}
            </div>
          )}

          {(hasPackages || hasExtras) && (
          <div className="space-y-6">
            {hasPackages && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Choose Your Package</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Compare</span>
                    <ToggleSwitch checked={comparePackages} onChange={setComparePackages} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {service.packages!.map((pkg) => (
                    <button
                      key={pkg.name}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.name)}
                      className={cn(
                        "rounded-lg border p-3 text-center transition-colors",
                        selectedPackage === pkg.name ? "border-[#5B3DF5] bg-[#F3F0FF]" : "border-border hover:border-[#5B3DF5]/40"
                      )}
                    >
                      <p className="text-xs font-semibold capitalize">{pkg.name}</p>
                      <p className="mt-1 text-sm font-bold">{formatCurrency(pkg.price)}</p>
                      <p className="text-xs text-muted-foreground">{pkg.deliveryDays} Days Delivery</p>
                    </button>
                  ))}
                </div>

                {!comparePackages ? (
                  !!activePackage?.features?.length && (
                    <ul className="space-y-1.5 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground font-semibold">What's included:</p>
                      {activePackage.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> {f}
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  <div className="overflow-x-auto border-t border-border pt-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="whitespace-nowrap py-1.5 pr-2 font-medium">Features</th>
                          {service.packages!.map((pkg) => (
                            <th key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center font-medium capitalize">
                              {pkg.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="whitespace-nowrap py-1.5 pr-2 text-muted-foreground">Price</td>
                          {service.packages!.map((pkg) => (
                            <td key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center font-semibold">
                              {formatCurrency(pkg.price)}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t border-border">
                          <td className="whitespace-nowrap py-1.5 pr-2 text-muted-foreground">Delivery Time</td>
                          {service.packages!.map((pkg) => (
                            <td key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center">
                              {pkg.deliveryDays} Days
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t border-border">
                          <td className="whitespace-nowrap py-1.5 pr-2 text-muted-foreground">Revisions</td>
                          {service.packages!.map((pkg) => (
                            <td key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center">
                              {pkg.revisions === -1 ? "Unlimited" : pkg.revisions}
                            </td>
                          ))}
                        </tr>
                        {allPackageFeatures.map((feature) => (
                          <tr key={feature} className="border-t border-border">
                            <td className="py-1.5 pr-2 text-muted-foreground">{feature}</td>
                            {service.packages!.map((pkg) => (
                              <td key={pkg.name} className="px-2 py-1.5 text-center">
                                {pkg.features?.includes(feature) ? (
                                  <Check className="mx-auto h-3.5 w-3.5 text-success" />
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {hasExtras && (
              <Card>
                <CardContent className="space-y-3 p-5">
                  <button
                    type="button"
                    onClick={() => setExtrasVisible((v) => !v)}
                    className="flex w-full items-center justify-between"
                    aria-expanded={extrasVisible}
                  >
                    <span className="text-sm font-semibold">Available Extras</span>
                    {extrasVisible ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {!extrasVisible && extrasTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedExtras.length} selected · +{formatCurrency(extrasTotal)}
                    </p>
                  )}
                  {extrasVisible && (
                    <>
                  {service.extras!.map((extra) => {
                    const quantity = extraQuantities[extra.label] ?? 0;
                    return (
                      <div key={extra.label} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 shrink-0 rounded border-border accent-[#5B3DF5]"
                            checked={quantity > 0}
                            onChange={(e) => setExtraQuantities((prev) => ({ ...prev, [extra.label]: e.target.checked ? 1 : 0 }))}
                          />
                          <span className="break-words">{extra.label}</span>
                        </label>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-muted-foreground">+{formatCurrency(extra.price)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={quantity === 0}
                              onClick={() => setExtraQuantities((prev) => ({ ...prev, [extra.label]: Math.max(0, quantity - 1) }))}
                              className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground disabled:opacity-30"
                              aria-label={`Decrease ${extra.label} quantity`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-4 text-center text-xs font-medium">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setExtraQuantities((prev) => ({ ...prev, [extra.label]: Math.min(10, quantity + 1) }))}
                              className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground"
                              aria-label={`Increase ${extra.label} quantity`}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {extrasTotal > 0 && (
                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                      <span>Extras Total</span>
                      <span>+{formatCurrency(extrasTotal)}</span>
                    </div>
                  )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

          {ordered ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Order Placed
            </div>
          ) : (
            <Button
              className="w-full bg-[#5B3DF5] text-white hover:bg-[#4C2FD6]"
              disabled={!user || user.id === freelancer?._id || orderMutation.isPending}
              onClick={() => (user ? orderMutation.mutate() : navigate("/login"))}
            >
              {orderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Continue ({formatCurrency(totalPrice)})
              {!orderMutation.isPending && <ArrowRight className="h-4 w-4" />}
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
            Contact Seller
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Pay only when you're satisfied with delivery
          </p>
        </div>
      </div>

      {trustBadges.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-4">
          {trustBadges.map((b) => (
            <div key={b.key} className="flex items-start gap-3">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", b.color)}>
                <b.icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-[11px] text-muted-foreground">{b.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
