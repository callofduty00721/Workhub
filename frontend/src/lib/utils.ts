import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: "INR" | "USD" = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formats a rupee amount the way Indian startup listings usually show funding: ₹2.5 Cr, ₹75 L, ₹8,000. */
export function formatFundingCompact(amount: number) {
  if (amount >= 10000000) return `₹${trimDecimal(amount / 10000000)} Cr`;
  if (amount >= 100000) return `₹${trimDecimal(amount / 100000)} L`;
  return formatCurrency(amount);
}

function trimDecimal(value: number) {
  return Number(value.toFixed(1)).toString();
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** "05d : 12h : 45m" countdown to a future ISO date, or null once it's passed. Computed once per render — good enough, doesn't need to tick live. */
export function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${String(days).padStart(2, "0")}d : ${String(hours).padStart(2, "0")}h : ${String(mins).padStart(2, "0")}m`;
}

// Same brackets as InfluencerMarketplace's FOLLOWER_RANGE_OPTIONS — kept
// here too (not imported from there) since that file is filter-UI-specific
// and this is used on cards/profiles that don't need the rest of it.
const FOLLOWER_TIERS = [
  { min: 1_000_000, label: "Mega" },
  { min: 500_000, label: "Macro" },
  { min: 100_000, label: "Mid" },
  { min: 10_000, label: "Micro" },
  { min: 1_000, label: "Nano" },
];

export function getFollowerTier(totalFollowers: number): string | null {
  return FOLLOWER_TIERS.find((t) => totalFollowers >= t.min)?.label ?? null;
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** "3m ago" / "5h ago" / "2d ago", falling back to a full locale date past a week. */
export function timeAgoShort(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "5 minutes ago" / "2 days ago" via Intl.RelativeTimeFormat, for notification-style feeds. */
export function timeAgoRelative(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  for (const [unit, secondsInUnit] of RELATIVE_TIME_UNITS) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return relativeTimeFormatter.format(-value, unit);
  }
  return "just now";
}

/** "5 mins ago" / "3 hours ago" / "2 days ago" / "1 week ago", pluralized, no date fallback. */
export function timeAgoWithWeeks(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

/** "3m ago" / "2h ago" / "5d ago", falling back to "Mon YYYY" for anything older than a month. */
export function timeAgoOrDate(dateStr?: string) {
  if (!dateStr) return "a while ago";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
