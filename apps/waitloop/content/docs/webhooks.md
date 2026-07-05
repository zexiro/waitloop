# Webhooks

Set `webhookUrl` on a waitlist (via MCP `create_waitlist`/`update_waitlist`, CLI `--webhook`, or the API) and Waitloop POSTs to it on every new signup and every referral milestone.

## `signup.created`

```json
{
  "event": "signup.created",
  "waitlist": { "id": "0d9c…", "slug": "acme-robots", "name": "Acme Robots" },
  "signup": {
    "id": "7f2a…",
    "email": "visitor@example.com",
    "referralCode": "k2m4p6q8",
    "createdAt": "2026-07-04T12:00:00.000Z"
  }
}
```

## `referral.milestone`

Fires when a referrer crosses 1, 5, or 10 referrals — the moments they earn a
queue item (balloon, pennant, golden glow). Useful for thanking your best
sharers automatically.

```json
{
  "event": "referral.milestone",
  "waitlist": { "id": "0d9c…", "slug": "acme-robots", "name": "Acme Robots" },
  "signup": {
    "id": "3b1e…",
    "email": "sharer@example.com",
    "referralCode": "x7f2m4p6",
    "referralCount": 5
  },
  "milestone": { "referrals": 5, "item": "pennant" }
}
```

- Delivery is fire-and-forget with a 5s timeout; there are no retries yet.
- Duplicate signups (same email joining again) do **not** fire the webhook.
- Remove the webhook by setting `"webhookUrl": null` via `PATCH`.
