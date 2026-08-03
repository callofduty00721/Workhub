import { FileText, Download, FileSpreadsheet, Archive, Megaphone, Flag, Handshake, Settings, Sparkles, type LucideIcon } from "lucide-react";
import { timeAgoWithWeeks } from "@/lib/utils";

// Shared by StartupDetails.tsx and its extracted tab/section components below.

export const DOCUMENT_CATEGORIES = ["Legal & Registration", "Financials", "Business Plan", "Pitch Deck", "Product", "Other"] as const;

export function fileIconFor(url: string) {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#fce8e8", fg: "#dc2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#ffece5", fg: "#FF5722" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#ffece5", fg: "#FF5722" };
  if (["doc", "docx"].includes(ext)) return { icon: FileText, bg: "#ffece5", fg: "#FF5722" };
  return { icon: FileText, bg: "#f1f5f9", fg: "#64748b" };
}

export const UPDATE_CATEGORIES = ["Announcement", "Milestone", "Partnership", "Development", "Other"] as const;

export const UPDATE_CATEGORY_META: Record<string, { bg: string; fg: string; icon: LucideIcon }> = {
  Announcement: { bg: "#ffece5", fg: "#FF5722", icon: Megaphone },
  Milestone: { bg: "#fdf1de", fg: "#d97706", icon: Flag },
  Partnership: { bg: "#f1ebfc", fg: "#7c3aed", icon: Handshake },
  Development: { bg: "#ffece5", fg: "#FF5722", icon: Settings },
  Other: { bg: "#f1f5f9", fg: "#64748b", icon: Sparkles },
};

export const timeAgo = timeAgoWithWeeks;

const NEW_INVESTOR_WINDOW_DAYS = 7;

export function isRecentAccount(createdAt: string) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs < NEW_INVESTOR_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function SectionCard({
  title,
  titleColor,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  titleColor?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold" style={titleColor ? { color: titleColor } : undefined}>
        {Icon && <Icon className="h-4 w-4" style={{ color: iconColor }} />} {title}
      </h3>
      {children}
    </div>
  );
}

export function EmptyNote({ text }: { text: string }) {
  return <p className="text-[12.5px] text-[#94a3b8]">{text}</p>;
}

export function DocRow({ name, url }: { name: string; url: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#FF5722]">
        <FileText className="h-4 w-4" />
      </span>
      <p className="flex-1 truncate text-[13px] font-semibold text-[#0f172a]">{name}</p>
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
        <Download className="h-3.5 w-3.5" /> View
      </a>
    </div>
  );
}
