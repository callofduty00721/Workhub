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

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
