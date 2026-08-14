import { useEffect } from "react";

const DEFAULT_TITLE = "GrowHive — Connect. Build. Grow.";
const DEFAULT_DESCRIPTION =
  "GrowHive — the platform where startups, freelancers, investors and mentors connect, build and grow together.";

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Sets document.title + description/OG meta for the page currently mounted,
// and restores index.html's defaults on unmount — a Vite SPA has no
// server-side render, so this is what a job/profile/startup detail page's
// browser tab, search result, and link-preview card actually reflect
// instead of the same static homepage copy everywhere.
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = `${title} · GrowHive`;
    document.title = fullTitle;
    setMetaTag("property", "og:title", fullTitle);
    if (description) {
      setMetaTag("name", "description", description);
      setMetaTag("property", "og:description", description);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag("property", "og:title", DEFAULT_TITLE);
      setMetaTag("name", "description", DEFAULT_DESCRIPTION);
      setMetaTag("property", "og:description", DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
