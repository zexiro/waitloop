# Embed widget

Drop the signup form into any site with one script tag — no iframe.

```html
<div data-waitloop="acme-robots" data-accent="#ff6b3d" data-button="Join the beta"></div>
<script src="https://waitloop.dev/embed.js" async></script>
```

- `data-waitloop` — the waitlist slug (required)
- `data-accent` — button color (default `#ff6b3d`)
- `data-button` — button label (default "Join the waitlist")

The widget inherits your page's font and text color, posts to the public signup endpoint (CORS-open), and after signup shows the visitor's position and referral link inline. If the visitor arrived with `?ref=<code>` in the URL, the referral is credited automatically.

Prefer full control? POST to the [public API](/docs/api) directly from your own form.
