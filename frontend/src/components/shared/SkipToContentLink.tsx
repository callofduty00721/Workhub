// Invisible until focused (Tab from the very top of the page) — lets a
// keyboard user jump straight past the navbar instead of tabbing through
// every nav link on every single page. Targets #main-content, set on both
// MarketingLayout's and DashboardLayout's <main>.
export function SkipToContentLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
    >
      Skip to content
    </a>
  );
}
