import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Lets sidebar links like /dashboard/freelancer#calendar jump straight to a
// section — React Router doesn't scroll to hash targets on its own.
export function useScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);
}
