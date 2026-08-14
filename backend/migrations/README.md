# Migrations

Versioned, tracked schema/data changes — replaces the old convention of one-off
scripts in `backend/scripts/` (`backfillCampaignIds.js` etc.), which had no
record of what had already been applied to a given database and no rollback.

Applied migrations are tracked in the `changelog` collection, so `up` is
always safe to re-run — anything already applied is skipped.

## Workflow

```bash
npm run migrate:create <name>   # scaffolds migrations/<timestamp>-<name>.js with up/down
npm run migrate:up              # applies every pending migration, in order
npm run migrate:down            # rolls back the single most recent migration
npm run migrate:status          # shows what's applied vs pending
```

Write both `up` and `down` — even when a migration only backfills data, `down`
should at least undo anything reversible (drop an added index/field), so a bad
deploy can actually be rolled back instead of requiring a manual fix on prod.

Run `migrate:up` as a deploy step (before the new app version starts serving
traffic), the same way you'd run any other pending-migrations check.
