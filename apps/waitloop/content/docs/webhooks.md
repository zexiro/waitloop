# Webhooks

Set `webhookUrl` on a waitlist (via MCP `create_waitlist`/`update_waitlist`, CLI `--webhook`, or the API) and Waitloop POSTs to it on every new signup.

## Payload

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

- Delivery is fire-and-forget with a 5s timeout; there are no retries yet.
- Duplicate signups (same email joining again) do **not** fire the webhook.
- Remove the webhook by setting `"webhookUrl": null` via `PATCH`.
