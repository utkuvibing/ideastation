# IdeaStation Production Runbook

## Authentication

Preferred company deployment uses an identity-aware reverse proxy:

```env
AUTH_MODE=trusted-header
AUTH_EMAIL_HEADER=x-auth-request-email
AUTH_ROLE_HEADER=x-auth-request-role
SESSION_SECRET=<at-least-32-random-characters>
```

Only the reverse proxy may reach the application container. It must remove incoming
authentication headers and set verified email and role values itself. Valid roles are
`viewer`, `reviewer`, `editor`, and `admin`.

For local authentication, generate password hashes with:

```powershell
node scripts/hash-password.mjs "a-long-random-password"
```

Configure users with `email:role:scrypt-hash`. Production validation rejects plaintext
passwords.

## Deployment

Create `.env.production`, set `IDEASTATION_HOST`, then run:

```powershell
docker compose up -d --build
```

Caddy terminates HTTPS and the application is only attached to the internal Docker
network. Health is available at `/api/health`.

## Backup And Restore

Run `docker compose exec ideastation npm run backup` daily. The default retention is
30 days; set `BACKUP_RETENTION_DAYS` to change it. Copy backups to separate encrypted
storage and test restore monthly:

```powershell
docker compose stop ideastation
docker compose run --rm ideastation npm run restore -- /app/backups/<backup>.db
docker compose up -d ideastation
```

Restore validates SQLite integrity and keeps a pre-restore safety copy.

## Release Check

```powershell
npm ci
npm run check
docker compose config
```

Never expose port 3000 directly when `AUTH_MODE=trusted-header`.

## Workflow Notifications

Optional workflow notifications can be sent when an idea changes status:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TEAMS_WEBHOOK_URL=https://...
```

Either variable may be omitted. Delivery outcomes are recorded in
`webhook_deliveries`; failures are also written to the central error log.
