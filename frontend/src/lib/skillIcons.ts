import type { ComponentType, SVGProps } from "react";
import { Palette, Code2, PenLine, TrendingUp, Sparkles, type LucideIcon } from "lucide-react";
import {
  SiTypescript,
  SiJavascript,
  SiReact,
  SiVuedotjs,
  SiAngular,
  SiNodedotjs,
  SiMongodb,
  SiPostgresql,
  SiMysql,
  SiPython,
  SiFigma,
  SiWordpress,
  SiMedium,
  SiGoogleanalytics,
  SiGoogleads,
  SiMeta,
} from "react-icons/si";

type IconComponent = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

// Real brand marks (Simple Icons) for specific technologies — these already
// look right standalone (their shape/color IS the recognizable logo), so the
// caller should render them without an extra circular badge wrapper.
const BRAND_ICON_RULES: { keywords: string[]; icon: IconComponent; color: string }[] = [
  { keywords: ["typescript"], icon: SiTypescript, color: "#3178C6" },
  { keywords: ["javascript"], icon: SiJavascript, color: "#F7DF1E" },
  { keywords: ["react"], icon: SiReact, color: "#61DAFB" },
  { keywords: ["vue"], icon: SiVuedotjs, color: "#4FC08D" },
  { keywords: ["angular"], icon: SiAngular, color: "#DD0031" },
  { keywords: ["node", "nodejs"], icon: SiNodedotjs, color: "#339933" },
  { keywords: ["mongodb", "mongo"], icon: SiMongodb, color: "#47A248" },
  { keywords: ["postgres", "postgresql"], icon: SiPostgresql, color: "#4169E1" },
  { keywords: ["mysql"], icon: SiMysql, color: "#4479A1" },
  { keywords: ["python"], icon: SiPython, color: "#3776AB" },
  { keywords: ["figma"], icon: SiFigma, color: "#F24E1E" },
  { keywords: ["wordpress"], icon: SiWordpress, color: "#21759B" },
  { keywords: ["medium"], icon: SiMedium, color: "#000000" },
  { keywords: ["google analytics", "googleanalytics"], icon: SiGoogleanalytics, color: "#E37400" },
  { keywords: ["google ads", "googleads"], icon: SiGoogleads, color: "#4285F4" },
  { keywords: ["meta ads", "facebook ads", "meta"], icon: SiMeta, color: "#0866FF" },
];

// Fallback for anything without a real brand mark — a generic lucide icon,
// meant to sit inside a small dark circular badge (see callers).
const GENERIC_ICON_RULES: { keywords: string[]; icon: LucideIcon; color: string }[] = [
  { keywords: ["ui", "ux", "design", "photoshop", "illustrator", "graphic"], icon: Palette, color: "#F472B6" },
  { keywords: ["backend", "api", "database", "sql", "developer", "development"], icon: Code2, color: "#3B82F6" },
  { keywords: ["writing", "content", "copy", "blog"], icon: PenLine, color: "#F59E0B" },
  { keywords: ["seo", "marketing", "growth", "ads"], icon: TrendingUp, color: "#F97316" },
];

const wordMatch = (text: string, keyword: string) => new RegExp(`\\b${keyword}\\b`, "i").test(text);

export interface SkillIcon {
  icon: IconComponent;
  color: string;
  // true when `icon` is a real brand logo that already includes its own
  // shape/background (e.g. TypeScript's blue rounded square) — render it
  // standalone. false means it's a plain glyph meant to sit inside a small
  // dark circular badge.
  brand: boolean;
}

export function getSkillIcon(skill: string): SkillIcon {
  const lower = skill.toLowerCase();

  const brandMatch = BRAND_ICON_RULES.find((rule) => rule.keywords.some((k) => wordMatch(lower, k)));
  if (brandMatch) return { icon: brandMatch.icon, color: brandMatch.color, brand: true };

  const genericMatch = GENERIC_ICON_RULES.find((rule) => rule.keywords.some((k) => wordMatch(lower, k)));
  if (genericMatch) return { icon: genericMatch.icon, color: genericMatch.color, brand: false };

  return { icon: Sparkles, color: "#8B5CF6", brand: false };
}
