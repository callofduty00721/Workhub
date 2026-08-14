import { createRequire } from "node:module";

// `disposable-email-domains` ships a plain CJS/JSON module — loaded via
// createRequire instead of a JSON import assertion so it works the same
// whether the running Node version wants `assert` or `with { type: "json" }`.
const require = createRequire(import.meta.url);
const DISPOSABLE_DOMAINS = new Set(require("disposable-email-domains"));

// Not "disposable" in the temp-inbox-service sense, but just as unreachable —
// these are IANA's reserved documentation domains, which is exactly what
// tutorials/examples (and this project's own test registrations) tend to use.
const RESERVED_DOCS_DOMAINS = new Set(["example.com", "example.org", "example.net", "example.edu", "test.com"]);

export function isDisposableEmail(email) {
  const domain = String(email).split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain) || RESERVED_DOCS_DOMAINS.has(domain);
}
