// Restores a backup made by scripts/backupDatabase.js. Meant for disaster
// recovery into an EMPTY database — refuses to run against a database that
// already has data unless --force is passed, so this can never silently
// duplicate/corrupt a live database by being run against the wrong target.
//
// Usage:
//   node scripts/restoreDatabase.js <path-to-backup.json.gz>
//   node scripts/restoreDatabase.js <path-to-backup.json.gz> --force
import "dotenv/config";
import fs from "fs";
import zlib from "zlib";
import { EJSON } from "bson";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { logger } from "../src/utils/logger.js";

const [, , filePath, ...flags] = process.argv;
const force = flags.includes("--force");

async function run() {
  if (!filePath) {
    logger.error("Usage: node scripts/restoreDatabase.js <path-to-backup.json.gz> [--force]");
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  await connectDB();

  if (!force) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const nonEmpty = [];
    for (const { name } of collections) {
      // eslint-disable-next-line no-await-in-loop
      const count = await mongoose.connection.db.collection(name).countDocuments();
      if (count > 0) nonEmpty.push(`${name} (${count} docs)`);
    }
    if (nonEmpty.length) {
      logger.error(
        `Refusing to restore — this database already has data in: ${nonEmpty.join(", ")}. ` +
          "This script is for restoring into an empty database (disaster recovery), not merging into a live one. " +
          "Pass --force only if you're certain (e.g. you've already dropped the collections you're restoring)."
      );
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  const raw = zlib.gunzipSync(fs.readFileSync(filePath)).toString("utf-8");
  const dump = EJSON.parse(raw);

  for (const [name, docs] of Object.entries(dump)) {
    if (!docs.length) continue;
    // eslint-disable-next-line no-await-in-loop
    await mongoose.connection.db.collection(name).insertMany(docs, { ordered: false });
    logger.info(`Restored collection: ${name} (${docs.length} docs)`);
  }

  logger.info("Restore complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error(`Database restore failed: ${err.message}`);
  process.exit(1);
});
