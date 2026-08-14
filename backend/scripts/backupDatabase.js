// Interim safety net until the MongoDB Atlas cluster is on a tier (M10+)
// that supports native Continuous Backup / point-in-time recovery — the
// free/shared tiers this project currently runs on have no backup at all.
// Dumps every collection to a single gzip-compressed EJSON file (preserves
// ObjectId/Date/etc — a plain JSON.stringify would silently corrupt them)
// and uploads it to the same Cloudflare R2 bucket already used for file
// uploads (falls back to a local file if R2 isn't configured — NOT durable,
// just lets this still run somewhere while you set R2 up).
//
// Usage:
//   node scripts/backupDatabase.js
//
// Schedule this externally (cron, GitHub Actions on a schedule, your host's
// scheduled-task feature) — it's a plain script, not a job wired into the
// running app, so a crashed/restarting app process can't skip a backup.
// See scripts/BACKUP.md for restore instructions and scheduling examples.
import "dotenv/config";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { EJSON } from "bson";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { getR2Client, isR2Configured } from "../src/config/r2.js";
import { logger } from "../src/utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fine for the DB sizes an early-stage launch has — loads one collection at a
// time (not the whole DB at once) but still holds each collection fully in
// memory. Once any collection is large enough for that to matter, this
// script has outlived its purpose — switch to mongodump/mongorestore instead
// (they stream and don't need this reimplementation at all).
async function dumpAllCollections() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const dump = {};
  for (const { name } of collections) {
    if (name === "changelog") continue; // migrate-mongo's own bookkeeping — not app data
    // eslint-disable-next-line no-await-in-loop
    dump[name] = await mongoose.connection.db.collection(name).find({}).toArray();
    logger.info(`Dumped collection: ${name} (${dump[name].length} docs)`);
  }
  return dump;
}

async function run() {
  await connectDB();

  const dump = await dumpAllCollections();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `growhive-backup-${timestamp}.json.gz`;
  const compressed = zlib.gzipSync(Buffer.from(EJSON.stringify(dump), "utf-8"));

  if (isR2Configured()) {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `db-backups/${filename}`,
        Body: compressed,
        ContentType: "application/gzip",
      })
    );
    logger.info(`Backup uploaded to R2: db-backups/${filename}`);
  } else {
    const localDir = path.join(__dirname, "..", "backups");
    fs.mkdirSync(localDir, { recursive: true });
    const localPath = path.join(localDir, filename);
    fs.writeFileSync(localPath, compressed);
    logger.warn(
      `R2 is not configured — backup written locally to ${localPath}. ` +
        "This only protects against data corruption, not a lost/destroyed host — configure R2_* env vars for a durable off-host copy."
    );
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error(`Database backup failed: ${err.message}`);
  process.exit(1);
});
