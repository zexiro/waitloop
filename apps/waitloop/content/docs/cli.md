# CLI

The Waitloop CLI is designed for LLMs and automation pipelines: **every command prints a single JSON object to stdout**, exit code 0 on success, 1 on failure (with `{"ok": false, "error": ...}`).

## Setup

```bash
export WAITLOOP_API_KEY=wl_YOUR_KEY        # create at /dashboard/keys
export WAITLOOP_API_URL=https://waitloop.dev   # only needed for self-hosted instances
```

No install needed — run through `npx waitloop`.

## Commands

```bash
npx waitloop me                             # who am I
npx waitloop waitlists:list                 # all waitlists + signup counts
npx waitloop waitlists:create --name "Acme Robots" \
  --headline "Robots for everyone" --accent "#ff6b3d" --background dark
npx waitloop waitlists:get acme-robots      # by slug or UUID
npx waitloop waitlists:update acme-robots --success "See you at launch."
npx waitloop waitlists:delete acme-robots
npx waitloop signups:list acme-robots --limit 50
npx waitloop signups:add acme-robots --email friend@example.com
npx waitloop stats acme-robots
npx waitloop export acme-robots --format csv   # prints raw CSV
```

### Create/update flags

| Flag | Maps to |
| --- | --- |
| `--name`, `--slug` | waitlist name / URL slug |
| `--headline`, `--description` | page copy |
| `--button`, `--success` | button label, post-signup message |
| `--accent` | hex accent color |
| `--background` | `dark` or `light` |
| `--logo` | logo image URL |
| `--webhook` | signup.created webhook URL |
| `--no-referrals` | disable referral ranking |

## Example output

```json
{
  "ok": true,
  "waitlist": {
    "id": "0d9c…",
    "slug": "acme-robots",
    "name": "Acme Robots",
    "pageUrl": "https://waitloop.dev/w/acme-robots",
    "referralsEnabled": true
  }
}
```
