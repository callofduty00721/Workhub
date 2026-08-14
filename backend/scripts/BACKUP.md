# Database backup / restore

Interim safety net until the Atlas cluster is upgraded to M10+ (the
free/shared tiers this currently runs on have no native backup at all — see
`backupDatabase.js` for details).

## Back up

```bash
npm run backup
```

Dumps every collection, gzips it, and uploads to R2 (`db-backups/` prefix) if
`R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET_NAME` are
set — otherwise writes to `backend/backups/` locally (gitignored; not durable,
since it lives on the same host as the database's application server).

## Restore

```bash
npm run restore -- <path-to-backup.json.gz>
```

Only runs against an **empty** database — refuses (with a clear error listing
which collections aren't empty) unless you pass `--force`. This is meant for
disaster recovery (the database is gone/corrupted), not for merging a backup
into a live one.

## Scheduling

This is a plain script, not a job wired into the running app — schedule it
externally so an app crash/restart can never cause a skipped backup:

- **Cron** (on any always-on host): `0 3 * * * cd /path/to/backend && npm run backup >> /var/log/growhive-backup.log 2>&1`
- **GitHub Actions**: a workflow on a `schedule:` trigger that checks out the
  repo, runs `npm ci`, and runs `npm run backup` with the env vars (Mongo/R2
  credentials) set as repo secrets.
- Most PaaS hosts (Render, Railway, Fly.io, ...) have a "scheduled job" /
  "cron job" feature — point it at `npm run backup` in this directory.

Once Atlas is upgraded to M10+, turn on Continuous Cloud Backup there and
treat this script as a secondary copy, not the primary one.
