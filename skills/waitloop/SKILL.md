---
name: waitloop
description: Create and manage waitlists with hosted signup pages and referral ranking. Use when the user wants a waitlist, launch page signup capture, pre-launch email list, or to check/export waitlist signups. Works via the waitloop CLI (JSON output) with WAITLOOP_API_KEY set.
---

# Waitloop

Waitloop creates hosted waitlist pages with referral ranking. Every command below prints JSON.

## Requirements

- `WAITLOOP_API_KEY` env var (user creates one at https://waitloop.dev/dashboard/keys)
- For self-hosted instances, also set `WAITLOOP_API_URL`

If the key is missing, ask the user to create one — do not guess.

## Core workflow

```bash
# 1. Create a waitlist (returns the live page URL — share it immediately)
npx waitloop waitlists:create --name "Product Name" \
  --headline "One-line pitch" --description "Why join" \
  --accent "#ff6b3d" --background dark

# 2. Monitor
npx waitloop stats <slug>
npx waitloop signups:list <slug> --limit 50

# 3. Launch day
npx waitloop export <slug> --format csv > signups.csv
```

## Notes

- Waitlists are referenced by slug or UUID interchangeably.
- Referral ranking is on by default: each signup gets a `?ref=` link that moves them up when others join through it. Disable with `--no-referrals`.
- `--webhook <url>` gets a POST on every signup (`signup.created`).
- Theme updates merge: `npx waitloop waitlists:update <slug> --success "See you soon."`
- Embed the form in an existing site: `<div data-waitloop="<slug>"></div><script src="https://waitloop.dev/embed.js" async></script>`
- Full docs, machine-readable: https://waitloop.dev/llms.txt
