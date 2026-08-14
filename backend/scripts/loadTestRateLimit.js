// Answers a concrete question about the global rate limiter (app.js —
// 300 requests / 15 min, keyed by IP by default since only the payment
// limiter overrides keyGenerator to per-user): how many realistic page loads
// from ONE IP does it actually take to trip it? Matters more than it might
// seem — the global limiter's default IP-based key means every user behind
// the same NAT/office/campus shares one 300-request budget, not 300 each.
//
// Fires bursts of real public (no-auth) GET requests against a locally
// running server, each burst modeling "a user opens a page that fires a
// few API calls at once", and reports how many bursts got through before
// the limiter started returning 429.
//
// Usage: node scripts/loadTestRateLimit.js [baseUrl]
// (run `node src/server.js` in another terminal first — this hits a real,
// running instance, not a mock)
const baseUrl = process.argv[2] || "http://localhost:5000";

// Mirrors a real session: each "page view" fires a handful of GET calls in
// parallel, same as a dashboard/directory page mounting several useQuery
// hooks at once. All public endpoints — no login needed, so this measures
// exactly what the IP-keyed global limiter sees.
const PAGE_VIEWS = [
  ["/api/campaigns", "/api/influencers"],
  ["/api/public-profiles/brand", "/api/public-profiles/agency", "/api/public-profiles/talent_partner"],
  ["/api/campaigns", "/api/health"],
];

async function fireBurst(urls) {
  const results = await Promise.all(
    urls.map(async (path) => {
      try {
        const res = await fetch(`${baseUrl}${path}`);
        return res.status;
      } catch (err) {
        return `ERR:${err.message}`;
      }
    })
  );
  return results;
}

async function run() {
  let totalRequests = 0;
  let first429At = null;
  const MAX_PAGE_VIEWS = 150; // plenty to cross 300 requests at ~2-3 calls/view

  console.log(`Load-testing global rate limiter against ${baseUrl} — firing realistic page-view bursts...\n`);

  for (let view = 1; view <= MAX_PAGE_VIEWS; view += 1) {
    const urls = PAGE_VIEWS[(view - 1) % PAGE_VIEWS.length];
    // eslint-disable-next-line no-await-in-loop
    const statuses = await fireBurst(urls);
    totalRequests += urls.length;

    const got429 = statuses.some((s) => s === 429);
    if (got429 && first429At === null) {
      first429At = { view, totalRequests };
      console.log(`Page view #${view} (request #${totalRequests}) — FIRST 429 seen. Statuses: ${statuses.join(", ")}`);
      break;
    }
  }

  console.log("\n--- Result ---");
  if (first429At) {
    console.log(`The limiter kicked in after ${first429At.view} page views (~${first429At.totalRequests} requests) from this one IP.`);
    console.log("Every other user behind the same IP (office/NAT/campus WiFi) shares that same budget — worth knowing before launch.");
  } else {
    console.log(`Fired ${totalRequests} requests across ${MAX_PAGE_VIEWS} simulated page views without hitting the limit.`);
    console.log("300/15min held up fine for this traffic shape — the concern flagged in the audit doesn't reproduce here.");
  }
}

run().catch((err) => {
  console.error("Load test failed:", err.message);
  console.error("Is the server actually running? Try: node src/server.js (in another terminal)");
  process.exit(1);
});
