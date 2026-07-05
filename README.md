<div align="center">

# ● waitloop

**Waitlists your agent can launch.**

A hosted waitlist page with referral ranking, created by one MCP tool call.
Agent-first: MCP server + JSON CLI + REST API. The dashboard is optional.

[waitloop.dev](https://waitloop.dev) · [Docs](https://waitloop.dev/docs) · [llms.txt](https://waitloop.dev/llms.txt)

</div>

---

Your agent builds the product. Waitloop starts the line:

```
> create a waitlist for my new CLI tool, dark page, orange accent

● waitloop  create_waitlist(...)
  ✓ live at https://waitloop.dev/w/ship-faster
```

Every waitlist gets a live hosted page, email capture, referral links (each signup gets a unique URL — when someone joins through it, the referrer moves up the list), stats, CSV export, webhooks, and an embeddable widget.

## For agents

**MCP** (the primary interface):

```bash
claude mcp add --transport http waitloop https://waitloop.dev/api/mcp \
  --header "Authorization: Bearer wl_YOUR_KEY"
```

8 tools: `create_waitlist`, `list_waitlists`, `update_waitlist`, `delete_waitlist`, `get_stats`, `list_signups`, `export_signups`, `add_signup`.

**CLI** — every command outputs structured JSON, designed for LLMs and pipelines:

```bash
WAITLOOP_API_KEY=wl_YOUR_KEY npx waitloop waitlists:create --name "Acme Robots"
npx waitloop stats acme-robots
npx waitloop export acme-robots --format csv
```

**REST**:

```bash
curl -X POST https://waitloop.dev/api/v1/waitlists \
  -H "Authorization: Bearer wl_YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"name": "Acme Robots"}'
```

Docs are agent-readable: [llms.txt](https://waitloop.dev/llms.txt), and every docs page is raw markdown when you append `.md`.

## Self-host

```bash
git clone https://github.com/zexiro/waitloop
cd waitloop
docker compose up -d
```

App on `:3000`, Postgres included, migrations run on boot. No license keys, no feature gates — everything in the cloud product works self-hosted. See [self-hosting docs](https://waitloop.dev/docs/self-hosting).

## Development

```bash
pnpm install
pnpm --dir apps/waitloop dev
```

No database needed for local dev — it falls back to embedded Postgres (PGlite) under `.data/`. Log in at `/login`; without `RESEND_API_KEY`, the magic link is printed to the server log.

## Repo layout

- `apps/waitloop` — Next.js app: hosted pages, dashboard, REST API, MCP server, docs
- `packages/cli` — the `waitloop` npm package (`npx waitloop`)
- `skills/waitloop` — agent skill (SKILL.md) for coding agents

## License

[AGPL-3.0](./LICENSE)
