import { logger } from "./logger.js";

// Every backend/scripts/seed/seed-demo-*, sample-*, and test-* script writes
// fake accounts/data (shared passwords, @growhive.demo/@growhive.test emails)
// meant only for a local/staging database. Dockerfile sets NODE_ENV=production
// for the deployed container, so this catches the realistic accident — someone
// runs a seed script with a shell whose .env happens to point at the real
// Atlas cluster (wrong terminal tab, copied command from an old note, CI job
// misconfigured) — without needing every seed script to reimplement the
// check. seedPlans.js is the one legitimate exception (real pricing data a
// fresh production DB actually needs) and deliberately doesn't call this.
export function assertNotProduction(scriptName) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    logger.error(
      `Refusing to run ${scriptName} — NODE_ENV=production and this script writes fake demo data. ` +
        "If you really mean to run this against this database, set ALLOW_DEMO_SEED=true explicitly."
    );
    process.exit(1);
  }
}
