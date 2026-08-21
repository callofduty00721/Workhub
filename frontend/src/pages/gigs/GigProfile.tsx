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
  ShoppingBag,
  Minus,
  Plus,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { HorizontalSlider } from "@/components/shared/HorizontalSlider";
import { serviceApi } from "@/api/freelancers";
import { usePageMeta } from "@/lib/usePageMeta";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { formatCurrency, initialsFromName, cn } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { getTechIcon } from "@/lib/techIcons";
import { useAuth } from "@/context/AuthContext";
import type { PackageName } from "@/types";

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

  usePageMeta(service ? service.title : "Gig", service ? service.description.slice(0, 160) : undefined);

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
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-64 w-full rounded-[20px] bg-[#EDEFEA]" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Service not found</p>
        <Link
          to="/freelancers"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const hasPackages = !!service.packages && service.packages.length > 0;
  const hasExtras = !!service.extras?.length;
  const allPackageFeatures = hasPackages ? Array.from(new Set(service.packages!.flatMap((p) => p.features ?? []))) : [];

  const extrasTotal = service.extras?.reduce((sum, extra) => sum + extra.price * (extraQuantities[extra.label] ?? 0), 0) ?? 0;
  const totalPrice = displayPrice + extrasTotal;

  // Real trust signals only — no generic always-on "Great Communication" /
  // "100% Satisfaction" claims that aren't backed by any actual metric.
  const trustBadges = [
    freelancer?.level === "top_rated" && {
      key: "top_rated",
      icon: Crown,
      color: "bg-[#FFFBEB] text-[#B45309]",
      title: "Top Rated Seller",
      subtitle: "Consistently amazing work with 100% success.",
    },
    freelancer?.onTimeDeliveryPercent !== undefined && {
      key: "on_time",
      icon: Zap,
      color: "bg-[#EFF6FF] text-[#2563EB]",
      title: `${freelancer.onTimeDeliveryPercent}% On-Time Delivery`,
      subtitle: "Consistently delivers on time.",
    },
    freelancer?.responseTimeLabel && {
      key: "response_time",
      icon: ShieldCheck,
      color: "bg-[#ECFDF3] text-[#16A34A]",
      title: "Fast Responder",
      subtitle: `Responds in ${freelancer.responseTimeLabel.toLowerCase()}`,
    },
  ].filter(Boolean) as { key: string; icon: typeof Crown; color: string; title: string; subtitle: string }[];

  return (
    <div className="bg-[#F7F8F5]">
      <style>{`
        .gig-layout { grid-template-areas: "gallery" "sidebar" "about"; }
        .gig-layout > .gig-gallery { grid-area: gallery; }
        .gig-layout > .gig-sidebar { grid-area: sidebar; }
        .gig-layout > .gig-about { grid-area: about; }
        @media (min-width: 1024px) {
          .gig-layout { grid-template-columns: 1fr 400px; grid-template-areas: "gallery sidebar" "about sidebar"; }
        }
      `}</style>
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/services" className="hover:text-[#111111]">
            Services
          </Link>{" "}
          / <span className="text-[#6B7280]">{service.title}</span>
        </nav>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-3 mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to Marketplace
        </button>

        <div className="gig-layout grid items-start gap-6">
          {/* Media gallery */}
          <div className="gig-gallery min-w-0">
            <div className="flex flex-col gap-3">
              <div className="relative h-[224px] sm:h-[420px] lg:h-[480px]">
                {service.images && service.images.length > 0 ? (
                  <div className="group relative h-full overflow-hidden rounded-[20px] bg-[#F1F3EF]">
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
                  <div className="flex h-full items-center justify-center rounded-[20px] bg-gradient-to-br from-[#F1F3EF] to-[#E5E7EB]">
                    <span className="text-5xl font-bold text-[#9CA3AF]">{service.title[0]}</span>
                  </div>
                )}
                <SaveButton type="service" id={service._id} className="absolute right-3 top-3 bg-white/95 text-[#6B7280] hover:bg-white" />
                {service.liveDemoUrl && (
                  <a
                    href={service.liveDemoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#111111] px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
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
                      className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2", i === activeImage ? "border-[#B6FF00]" : "border-transparent")}
                    >
                      <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  {service.images.length > 5 && (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F1F3EF] text-xs font-medium text-[#6B7280]">
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
                    className="aspect-video w-full rounded-[20px] border border-[#E5E7EB]"
                  />
                ) : (
                  <video src={service.video} controls className="max-h-96 w-full rounded-[20px] border border-[#E5E7EB]" />
                ))}
            </div>
          </div>

          <div className="gig-about min-w-0 space-y-6">
            <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1FFD6] text-[#4D7A00]">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold text-[#111111]">About This Gig</h2>
              </div>
              {(() => {
                const descriptionIsLong = service.description.length > DESCRIPTION_PREVIEW_LENGTH;
                const descriptionText = !descriptionIsLong || descriptionExpanded ? service.description : `${service.description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`;
                return (
                  <>
                    <div className="text-[13.5px] leading-[1.7] text-[#4B5563]" dangerouslySetInnerHTML={{ __html: renderBioHtml(descriptionText) }} />
                    {descriptionIsLong && (
                      <button type="button" onClick={() => setDescriptionExpanded((v) => !v)} className="mt-1.5 text-xs font-semibold text-[#111111] hover:underline">
                        {descriptionExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </>
                );
              })()}

              {service.skills.length > 0 && (
                <div className="mt-5 border-t border-[#F1F3EF] pt-4">
                  <p className="mb-2 text-sm font-bold text-[#111111]">Technologies I Use</p>
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((skill) => {
                      const tech = getTechIcon(skill);
                      return (
                        <span key={skill} className="flex items-center gap-1.5 rounded-full bg-[#F3F5F1] px-2.5 py-1.5 text-xs font-medium text-[#4B5563]">
                          {tech && <tech.icon className="h-3.5 w-3.5 shrink-0" style={{ color: tech.color }} />}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#F1F3EF] pt-4 text-xs sm:grid-cols-4">
                {service.experienceLevel && (
                  <div>
                    <p className="text-[#9CA3AF]">Experience Level</p>
                    <p className="font-semibold capitalize text-[#111111]">{service.experienceLevel}</p>
                  </div>
                )}
                {!!service.languages?.length && (
                  <div>
                    <p className="text-[#9CA3AF]">Languages</p>
                    <p className="font-semibold text-[#111111]">{service.languages.join(", ")}</p>
                  </div>
                )}
                {freelancer?.jobsCompleted !== undefined && (
                  <div>
                    <p className="text-[#9CA3AF]">Projects Completed</p>
                    <p className="font-semibold text-[#111111]">{freelancer.jobsCompleted}+</p>
                  </div>
                )}
                {freelancer?.createdAt && (
                  <div>
                    <p className="text-[#9CA3AF]">Member Since</p>
                    <p className="font-semibold text-[#111111]">{new Date(freelancer.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
                  </div>
                )}
              </div>
            </section>

            {!!freelancer?.portfolioItems?.length && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#111111]">Portfolio ({freelancer.portfolioItems.length})</h2>
                  <Link to={`/freelancers/${freelancer._id}`} className="flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline">
                    View All Portfolio <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <HorizontalSlider itemClassName="w-56">
                  {freelancer.portfolioItems.map((item, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-[#E5E7EB]">
                      <div className="flex h-32 w-full items-center justify-center bg-[#F1F3EF]">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-[#9CA3AF]">{item.title[0]}</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-semibold text-[#111111]">{item.title}</p>
                        {!!item.tags?.length && <p className="truncate text-[10px] text-[#9CA3AF]">{item.tags.join(", ")}</p>}
                      </div>
                    </div>
                  ))}
                </HorizontalSlider>
              </section>
            )}

            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <ReviewsSection targetType="service" targetId={service._id} />
            </div>
          </div>

          {/* Info + price panel */}
          <div className="gig-sidebar space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#111111]">
                  <span>{service.category}</span>
                  {service.subCategory && (
                    <>
                      <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <span className="text-[#6B7280]">{service.subCategory}</span>
                    </>
                  )}
                </div>
                {service.ordersCount > 0 && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                    <ShoppingBag className="h-3.5 w-3.5" /> {service.ordersCount}
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-2xl font-extrabold leading-snug text-[#111111]">{service.title}</h1>

              {freelancer && (
                <div className="mt-3 space-y-2.5">
                  <Link to={`/freelancers/${freelancer._id}`} className="group flex items-center gap-2.5">
                    <Avatar className="h-10 w-10 border border-[#E5E7EB]">
                      <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                      <AvatarFallback className="bg-[#111111] text-xs font-semibold text-white">{initialsFromName(freelancer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-[#111111] group-hover:underline">{freelancer.name}</span>
                        {freelancer.level === "top_rated" && (
                          <span className="flex items-center gap-1 rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">
                            <Crown className="h-2.5 w-2.5" /> Top Rated
                          </span>
                        )}
                        {freelancer.level === "level_1" && (
                          <span className="flex items-center gap-1 rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10px] font-semibold text-[#4B5563]">
                            <Award className="h-2.5 w-2.5" /> Level 1 Seller
                          </span>
                        )}
                      </div>
                      {(freelancer.headline || !!freelancer.yearsOfExperience) && (
                        <p className="text-xs text-[#9CA3AF]">
                          {freelancer.headline}
                          {!!freelancer.headline && !!freelancer.yearsOfExperience && " | "}
                          {!!freelancer.yearsOfExperience && `${freelancer.yearsOfExperience}+ Years Experience`}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[3.25rem] text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {service.rating || "0.0"}
                      {service.reviewCount > 0 && ` (${service.reviewCount} reviews)`}
                    </span>
                    {freelancer.onTimeDeliveryPercent !== undefined && (
                      <span className="flex items-center gap-1 text-[#16A34A]">
                        <ShieldCheck className="h-3.5 w-3.5" /> {freelancer.onTimeDeliveryPercent}% On-Time Delivery
                      </span>
                    )}
                    {freelancer.responseTimeLabel && (
                      <span className="flex items-center gap-1 text-[#16A34A]">
                        <Clock className="h-3.5 w-3.5" /> Response Time: {freelancer.responseTimeLabel.toLowerCase()}
                      </span>
                    )}
                  </div>
                  {typeof service?.company === "object" && service.company?.name && (
                    <span className="ml-[3.25rem] inline-flex items-center rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-medium text-[#4B5563]">
                      {service.company.name}
                    </span>
                  )}
                </div>
              )}

              {freelancer?.availabilityStatus === "available" && (
                <div className="mt-4 rounded-xl bg-[#ECFDF3] px-3 py-2 text-sm text-[#16A34A]">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#16A34A]" /> Available for new projects
                  </p>
                  {freelancer.responseTimeLabel && <p className="mt-0.5 pl-4 text-xs text-[#16A34A]/80">Response in {freelancer.responseTimeLabel.toLowerCase()}</p>}
                </div>
              )}
            </div>

            {(hasPackages || hasExtras) && (
              <div className="space-y-5">
                {hasPackages && (
                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#111111]">Choose Your Package</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#6B7280]">Compare</span>
                        <ToggleSwitch checked={comparePackages} onChange={setComparePackages} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {service.packages!.map((pkg) => (
                        <button
                          key={pkg.name}
                          type="button"
                          onClick={() => setSelectedPackage(pkg.name)}
                          className={cn(
                            "rounded-xl border p-3 text-center transition-colors",
                            selectedPackage === pkg.name ? "border-[#B6FF00] bg-[#F1FFD6]/50" : "border-[#E5E7EB] hover:border-[#B6FF00]/50"
                          )}
                        >
                          <p className="text-xs font-bold capitalize text-[#111111]">{pkg.name}</p>
                          <p className="mt-1 text-sm font-extrabold text-[#111111]">{formatCurrency(pkg.price)}</p>
                          <p className="text-xs text-[#9CA3AF]">{pkg.deliveryDays} Days Delivery</p>
                        </button>
                      ))}
                    </div>

                    {!comparePackages ? (
                      !!activePackage?.features?.length && (
                        <ul className="mt-4 space-y-1.5 border-t border-[#F1F3EF] pt-3">
                          <p className="text-xs font-semibold text-[#9CA3AF]">What's included:</p>
                          {activePackage.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-[#4B5563]">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" /> {f}
                            </li>
                          ))}
                        </ul>
                      )
                    ) : (
                      <div className="mt-4 overflow-x-auto border-t border-[#F1F3EF] pt-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-[#9CA3AF]">
                              <th className="whitespace-nowrap py-1.5 pr-2 font-medium">Features</th>
                              {service.packages!.map((pkg) => (
                                <th key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center font-medium capitalize">
                                  {pkg.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-[#F1F3EF]">
                              <td className="whitespace-nowrap py-1.5 pr-2 text-[#9CA3AF]">Price</td>
                              {service.packages!.map((pkg) => (
                                <td key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center font-semibold text-[#111111]">
                                  {formatCurrency(pkg.price)}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-t border-[#F1F3EF]">
                              <td className="whitespace-nowrap py-1.5 pr-2 text-[#9CA3AF]">Delivery Time</td>
                              {service.packages!.map((pkg) => (
                                <td key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center text-[#111111]">
                                  {pkg.deliveryDays} Days
                                </td>
                              ))}
                            </tr>
                            <tr className="border-t border-[#F1F3EF]">
                              <td className="whitespace-nowrap py-1.5 pr-2 text-[#9CA3AF]">Revisions</td>
                              {service.packages!.map((pkg) => (
                                <td key={pkg.name} className="whitespace-nowrap px-2 py-1.5 text-center text-[#111111]">
                                  {pkg.revisions === -1 ? "Unlimited" : pkg.revisions}
                                </td>
                              ))}
                            </tr>
                            {allPackageFeatures.map((feature) => (
                              <tr key={feature} className="border-t border-[#F1F3EF]">
                                <td className="py-1.5 pr-2 text-[#9CA3AF]">{feature}</td>
                                {service.packages!.map((pkg) => (
                                  <td key={pkg.name} className="px-2 py-1.5 text-center">
                                    {pkg.features?.includes(feature) ? <Check className="mx-auto h-3.5 w-3.5 text-[#16A34A]" /> : <span className="text-[#D1D5DB]">—</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {hasExtras && (
                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
                    <button type="button" onClick={() => setExtrasVisible((v) => !v)} className="flex w-full items-center justify-between" aria-expanded={extrasVisible}>
                      <span className="text-sm font-bold text-[#111111]">Available Extras</span>
                      {extrasVisible ? <ChevronUp className="h-4 w-4 text-[#9CA3AF]" /> : <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />}
                    </button>
                    {!extrasVisible && extrasTotal > 0 && (
                      <p className="mt-2 text-xs text-[#6B7280]">
                        {selectedExtras.length} selected · +{formatCurrency(extrasTotal)}
                      </p>
                    )}
                    {extrasVisible && (
                      <div className="mt-3 space-y-3">
                        {service.extras!.map((extra) => {
                          const quantity = extraQuantities[extra.label] ?? 0;
                          return (
                            <div key={extra.label} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[#4B5563]">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 shrink-0 rounded border-[#D1D5DB] accent-[#B6FF00]"
                                  checked={quantity > 0}
                                  onChange={(e) => setExtraQuantities((prev) => ({ ...prev, [extra.label]: e.target.checked ? 1 : 0 }))}
                                />
                                <span className="break-words">{extra.label}</span>
                              </label>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-[#9CA3AF]">+{formatCurrency(extra.price)}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={quantity === 0}
                                    onClick={() => setExtraQuantities((prev) => ({ ...prev, [extra.label]: Math.max(0, quantity - 1) }))}
                                    className="flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB] text-[#6B7280] disabled:opacity-30"
                                    aria-label={`Decrease ${extra.label} quantity`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-4 text-center text-xs font-semibold text-[#111111]">{quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => setExtraQuantities((prev) => ({ ...prev, [extra.label]: Math.min(10, quantity + 1) }))}
                                    className="flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB] text-[#6B7280]"
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
                          <div className="flex items-center justify-between border-t border-[#F1F3EF] pt-3 text-sm font-bold text-[#111111]">
                            <span>Extras Total</span>
                            <span>+{formatCurrency(extrasTotal)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5 rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              {ordered ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-[#16A34A]/30 bg-[#ECFDF3] py-2.5 text-sm font-semibold text-[#16A34A]">
                  <CheckCircle2 className="h-4 w-4" /> Order Placed
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!user || user.id === freelancer?._id || orderMutation.isPending}
                  onClick={() => (user ? orderMutation.mutate() : navigate("/login"))}
                  className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
                >
                  {orderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Continue ({formatCurrency(totalPrice)})
                  {!orderMutation.isPending && <ArrowRight className="h-4 w-4" />}
                </button>
              )}
              {orderError && <p className="text-xs text-[#EF4444]">{orderError}</p>}
              <button
                type="button"
                disabled={!user || messageMutation.isPending}
                onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] border border-[#E5E7EB] bg-white text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-50"
              >
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Contact Seller
              </button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF]">
                <ShieldCheck className="h-3.5 w-3.5" /> Pay only when you're satisfied with delivery
              </p>
            </div>
          </div>
        </div>

        {trustBadges.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 rounded-[20px] border border-[#E5E7EB] bg-white p-6 sm:grid-cols-3">
            {trustBadges.map((b) => (
              <div key={b.key} className="flex items-start gap-3">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", b.color)}>
                  <b.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111111]">{b.title}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{b.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
