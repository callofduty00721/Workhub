import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Fills the gutter the floating navbar leaves around itself (top offset +
          side margins) so that strip reads as black instead of the page's base
          background — sized to just the navbar's own footprint, not the rest of
          the page, so pages with light content below aren't affected. */}
      <div className="fixed inset-x-0 top-0 -z-10 h-[4.25rem] bg-black" />
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
