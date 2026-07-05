# MCP server

Waitloop's MCP server is the primary way agents use the product.

- **Endpoint**: `https://waitloop.dev/api/mcp` (self-hosted: `<your-host>/api/mcp`)
- **Transport**: streamable HTTP, stateless — plain JSON responses, no SSE required
- **Auth**: `Authorization: Bearer wl_YOUR_KEY` (create keys at `/dashboard/keys`)

## Connect

```bash
# Claude Code
claude mcp add --transport http waitloop https://waitloop.dev/api/mcp \
  --header "Authorization: Bearer wl_YOUR_KEY"
```

Any MCP client that speaks streamable HTTP works the same way.

## Tools

| Tool | What it does |
| --- | --- |
| `create_waitlist` | Create a waitlist + live hosted page. Args: `name` (required), `slug`, `theme` (headline, description, buttonText, successMessage, logoUrl, accentColor, background), `referralsEnabled`, `webhookUrl`. Returns the public `pageUrl`. |
| `list_waitlists` | All waitlists with signup counts and page URLs. |
| `update_waitlist` | Patch name/slug/theme/referrals/webhook. Theme fields merge, not replace. |
| `delete_waitlist` | Permanently delete a waitlist and its signups. |
| `get_stats` | Total signups, last 24h, last 7d, referred count, top referrers. |
| `list_signups` | Signups ordered by position. `limit` (≤1000), `offset`. |
| `export_signups` | Full CSV export (email, position, referral code, referral count, created_at). |
| `add_signup` | Add a signup directly (imports, manual adds). Dedupes by email. |

Waitlists can be referenced by UUID **or slug** in every tool that takes an `id`.

## Example session

> **User**: launch a waitlist for the beta of my screenshot API
>
> **Agent** calls `create_waitlist` with `{"name": "Screenshot API beta", "theme": {"headline": "Screenshots, one GET request away", "accentColor": "#ff6b3d"}}`
>
> **Result**: `{"waitlist": {"slug": "screenshot-api-beta", "pageUrl": "https://waitloop.dev/w/screenshot-api-beta", ...}}`

The page is live the moment the call returns.
