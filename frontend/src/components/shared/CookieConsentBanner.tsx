import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "growhive_cookie_consent";

// Simple accept/decline banner, not a granular cookie-category picker — this
// app doesn't set third-party tracking cookies today (see PrivacyPolicy.tsx:
// only the httpOnly refresh-token cookie, which is strictly necessary and
// exempt from consent requirements under most cookie-law regimes anyway).
// Kept anyway since a global audience may include EU/UK visitors, and
// "decline" is still offered a real choice rather than a dark-pattern-only
// accept button.
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const respond = (choice: "accepted" | "declined") => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-3 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6 sm:py-4">
      {/* Single row at every width, not stacked — a mobile viewport only has
          so much vertical space, and a full-width text block sitting above a
          full-width button row ate enough of it to cover page content
          underneath. Text just wraps within its own space next to the
          buttons instead. */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-xs text-muted-foreground sm:text-sm">
          We use a necessary cookie to keep you signed in. See our{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => respond("declined")}>
            Decline
          </Button>
          <Button variant="gradient" size="sm" onClick={() => respond("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
