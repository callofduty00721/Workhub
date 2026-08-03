import { Sparkles, ShieldCheck, Rocket } from "lucide-react";
import { OverlapCardStack, type OverlapCardItem } from "@/components/shared/OverlapCardStack";
import { RoleRailSection } from "@/pages/Home";

// Generic placeholder data — swap this out with whatever content the new
// usage needs. Only `icon`, `tag`, `title`, `description`, `points`, and
// `href` are required; `ctaLabel` defaults to "Get Started".
const EXAMPLE_ITEMS: OverlapCardItem[] = [
  {
    icon: Sparkles,
    tag: "Step one",
    title: "This is a template card.",
    description: "Swap the icon, tag, title, description, points, and link for whatever content this new section needs.",
    points: ["Any icon from lucide-react works here", "Points render as a checklist", "Link the whole card anywhere with href"],
    href: "/",
  },
  {
    icon: ShieldCheck,
    tag: "Step two",
    title: "Each card pins, then gets covered.",
    description: "Add as many items as you want to the array — every card gets its own scroll row automatically.",
    points: ["No extra wiring needed per card", "Works with any number of items", "Same sticky + parallax behavior throughout"],
    href: "/",
    ctaLabel: "Learn more",
  },
  {
    icon: Rocket,
    tag: "Step three",
    title: "Drop it in anywhere.",
    description: "Import OverlapCardStack, pass an items array, done.",
    points: ["Self-contained component", "No page-specific dependencies", "Reused as-is on the homepage"],
    href: "/",
  },
];

export default function OverlapCardDemo() {
  return (
    <div>
      <div className="container py-10">
        <h1 className="text-2xl font-bold tracking-tight">Overlap card template</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scroll down — each card pins near the top, then the next card slides up and covers it. First: a generic
          example with placeholder content. Below that: the same component reused as-is on the homepage.
        </p>
      </div>

      <div className="container">
        <OverlapCardStack items={EXAMPLE_ITEMS} />
      </div>

      <div className="container border-t border-neutral-100 py-10">
        <h2 className="text-lg font-bold tracking-tight">Live usage: homepage role rail</h2>
        <p className="mt-1 text-sm text-muted-foreground">Same component, real MahaHub content — no duplicated code.</p>
      </div>
      <RoleRailSection />
    </div>
  );
}
