# Waitloop

Waitloop creates hosted waitlist pages with referral ranking. It is **agent-first**: the primary interfaces are an MCP server, a JSON-first CLI, and a plain REST API. The dashboard exists, but nothing requires it.

Every waitlist gets:

- A live hosted page at `/w/<slug>` with email capture
- Referral links — each signup gets a unique URL; when someone joins through it, the referrer moves up the list
- Stats (total, 24h, 7d, top referrers), CSV export, and a `signup.created` webhook

## Quickstart (60 seconds)

1. **Get an API key**: log in at [/login](/login), then create a key at [/dashboard/keys](/dashboard/keys). Keys look like `wl_...` and unlock the MCP server, CLI, and REST API.

2. **Connect your agent** (Claude Code shown; any MCP client works):

```bash
claude mcp add --transport http waitloop https://waitloop.dev/api/mcp \
  --header "Authorization: Bearer wl_YOUR_KEY"
```

3. **Ask for a waitlist**:

> create a waitlist called "Acme Robots", dark page, accent #ff6b3d

The `create_waitlist` tool call returns a live page URL. Share it — the line is open.

## Or skip MCP entirely

```bash
# CLI — every command prints JSON
WAITLOOP_API_KEY=wl_YOUR_KEY npx waitloop waitlists:create --name "Acme Robots"

# REST
curl -X POST https://waitloop.dev/api/v1/waitlists \
  -H "Authorization: Bearer wl_YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"name": "Acme Robots"}'
```

## Docs

- [MCP server](/docs/mcp) — endpoint, auth, all 8 tools
- [CLI](/docs/cli) — commands and flags
- [REST API](/docs/api) — endpoints with curl examples
- [Webhooks](/docs/webhooks) — signup.created payload
- [Embed widget](/docs/embed) — drop the form into any site
- [Self-hosting](/docs/self-hosting) — docker compose up

Machine-readable index: [/llms.txt](/llms.txt). Every page here is also raw markdown — append `.md` to the URL.
