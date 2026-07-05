# REST API

Base URL: `https://waitloop.dev/api/v1` (self-hosted: `<your-host>/api/v1`).
Auth: `Authorization: Bearer wl_YOUR_KEY` on every request. All bodies are JSON.

Waitlists can be referenced by UUID **or slug** in path parameters.

## Endpoints

### `GET /me`
Returns the account the key belongs to.

### `GET /waitlists`
List waitlists with `signupCount` and `pageUrl`.

### `POST /waitlists`
```bash
curl -X POST https://waitloop.dev/api/v1/waitlists \
  -H "Authorization: Bearer wl_YOUR_KEY" -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Robots",
    "slug": "acme-robots",
    "theme": {
      "headline": "Robots for everyone",
      "description": "The waitlist for our launch.",
      "buttonText": "Join the waitlist",
      "successMessage": "You are in.",
      "accentColor": "#ff6b3d",
      "background": "dark"
    },
    "referralsEnabled": true,
    "avatarsEnabled": true,
    "webhookUrl": "https://example.com/hooks/waitloop"
  }'
```
Returns `201` with `{"waitlist": {..., "pageUrl"}}`. Omit `slug` to derive it from the name.
`avatarsEnabled` (default `true`) shows the queue of signup avatars on the hosted page and lets signups customize theirs.

### `GET /waitlists/:id` · `PATCH /waitlists/:id` · `DELETE /waitlists/:id`
Read, patch (theme fields merge), or delete. `PATCH` accepts the same fields as create; set `"webhookUrl": null` to remove.

### `GET /waitlists/:id/signups?limit=100&offset=0`
Signups ordered by position (referral count desc, then signup time). `limit` ≤ 1000.

### `POST /waitlists/:id/signups`
```json
{
  "email": "friend@example.com",
  "referredByCode": "abc123",
  "avatar": { "expression": "wink", "accessory": "cap", "color": "#9ecbf5" },
  "metadata": { "source": "import" }
}
```
Owner-side add (imports, manual). Dedupes by email — returns `200` with the existing signup instead of `201`.
`avatar` is optional; omitted fields are dealt deterministically from the signup's referral code.
Expressions: `smile` `grin` `wink` `joy` `starry`. Accessories: `none` `party` `cap` `bow` `glasses`. Color: any hex.

### `GET /waitlists/:id/signups/export?format=csv`
Full export. `format=json` (default) or `format=csv` (returns `text/csv`).

### `GET /waitlists/:id/stats`
`{"stats": {"total", "last24h", "last7d", "referred", "topReferrers", "pageUrl"}}`

## Public signup (no auth — used by hosted pages and embeds)

### `POST /api/public/w/:slug/signups`
```json
{ "email": "visitor@example.com", "ref": "abc123", "avatar": { "expression": "grin" } }
```
Returns `{"created", "position", "referralUrl", "referralCode", "avatar", "earned", "successMessage"}`. CORS-open.
`earned` lists items the queue has handed out: `crown` (holding #1), `balloon`/`pennant`/`glow` (1/5/10 referrals).

### `PATCH /api/public/w/:slug/signups`
```json
{ "code": "k2m4p6q8", "avatar": { "accessory": "party", "color": "#ffd166" } }
```
Update your queue avatar after joining — `code` is your referral code, no account needed.
Returns `{"position", "avatar", "earned"}`. CORS-open.

## Errors

Non-2xx responses are `{"error": "message"}`. `401` missing/bad key, `404` not found (or not yours), `409` slug taken, `400` validation (includes `issues`).
