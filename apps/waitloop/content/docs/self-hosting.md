# Self-hosting

Waitloop is AGPL-3.0 and runs anywhere Docker runs.

## docker compose

```bash
git clone https://github.com/zexiro/waitloop
cd waitloop
docker compose up -d
```

The compose file starts Postgres and the app on `http://localhost:3000`. Migrations run automatically on boot.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | in production | `postgres://user:pass@host:5432/waitloop`. Without it, dev falls back to an embedded PGlite database under `.data/`. |
| `APP_URL` | yes | Public URL of the instance, e.g. `https://waitlist.example.com`. Used in page links, referral URLs, and magic-link emails. |
| `RESEND_API_KEY` | no | Enables real login emails via Resend. Without it, magic links are printed to the server log — fine for single-user instances. |
| `EMAIL_FROM` | no | From address, e.g. `Waitloop <login@waitlist.example.com>`. |

## Running without Docker

```bash
pnpm install
DATABASE_URL=postgres://… APP_URL=https://… pnpm --dir apps/waitloop build
pnpm --dir apps/waitloop start
```

## Pointing agents at your instance

- MCP: `<your-host>/api/mcp`
- CLI: `export WAITLOOP_API_URL=<your-host>`
- API: `<your-host>/api/v1`

Everything in the cloud product works self-hosted — no license keys, no feature gates.
