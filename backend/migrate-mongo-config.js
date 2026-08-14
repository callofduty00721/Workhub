import "dotenv/config";

// Versioned, tracked migrations — replaces the old convention of one-off
// scripts in backend/scripts/ (backfillCampaignIds.js etc.), which have no
// record of what's already been applied to a given database and no `down`.
// migrate-mongo tracks applied migrations in the `changelog` collection
// below, so running `npm run migrate:up` against prod is always safe to
// re-run (already-applied migrations are skipped) and every change has a
// matching rollback. See migrations/README.md for the day-to-day workflow.
export default {
  mongodb: {
    url: process.env.MONGO_URI,
    options: {},
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  // Matches this project's package.json ("type": "module") — `migrate-mongo
  // create` scaffolds new migration files with import/export default instead
  // of require/module.exports.
  moduleSystem: "esm",
};
