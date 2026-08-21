// One-time destructive reset, run manually after backupDatabase.js has been
// confirmed successful. Empties every collection EXCEPT:
//   - `changelog` (migrate-mongo's own bookkeeping, not app data)
//   - `plans` (seeded separately via seedPlans.js — pricing config, not demo content)
//   - `platformsettings` (live commission%/disabledRoles config the running app needs)
//   - the single `users` document for the operator's own personal super_admin
//     login, preserved by email so they aren't locked out afterward.
//
// Usage:
//   node scripts/wipeAndReset.js
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { assertNotProduction } from "../src/utils/seedGuard.js";
import { logger } from "../src/utils/logger.js";

const PRESERVE_SUPER_ADMIN_EMAIL = "aditya361995@gmail.com";
const SKIP_COLLECTIONS = new Set(["changelog", "plans", "platformsettings"]);

async function run() {
  assertNotProduction("wipeAndReset");
  await connectDB();

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  for (const { name } of collections) {
    if (SKIP_COLLECTIONS.has(name)) {
      logger.info(`Skipped (preserved): ${name}`);
      continue;
    }

    if (name === "users") {
      const result = await db.collection("users").deleteMany({ email: { $ne: PRESERVE_SUPER_ADMIN_EMAIL } });
      logger.info(`Wiped users: ${result.deletedCount} deleted, kept ${PRESERVE_SUPER_ADMIN_EMAIL}`);
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await db.collection(name).deleteMany({});
    logger.info(`Wiped ${name}: ${result.deletedCount} deleted`);
  }

  logger.info("Wipe complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error(`Wipe failed: ${err.message}`);
  process.exit(1);
});
