#!/usr/bin/env node
/* Waitloop CLI — designed for LLMs and automation pipelines.
 * Every command prints a single JSON object to stdout. Exit code 0 = success.
 * Auth: WAITLOOP_API_KEY env var. Endpoint: WAITLOOP_API_URL (default https://waitloop.dev).
 */
import { parseArgs } from "node:util";

const API_URL = (process.env.WAITLOOP_API_URL || "https://waitloop.dev").replace(/\/$/, "");
const API_KEY = process.env.WAITLOOP_API_KEY;

const HELP = {
  usage: "waitloop <command> [arguments] [--flags]",
  auth: "set WAITLOOP_API_KEY (create one at " + API_URL + "/dashboard/keys)",
  endpoint: "set WAITLOOP_API_URL to target a self-hosted instance (default " + API_URL + ")",
  commands: {
    "me": "show the account this API key belongs to",
    "waitlists:list": "list all waitlists with signup counts",
    "waitlists:create --name <name> [--slug <slug>] [--headline <text>] [--description <text>] [--button <text>] [--success <text>] [--accent <#hex>] [--background dark|light] [--logo <url>] [--no-referrals] [--webhook <url>]":
      "create a waitlist; returns the live page URL",
    "waitlists:get <id-or-slug>": "get one waitlist",
    "waitlists:update <id-or-slug> [same flags as create]": "update a waitlist (theme fields merge)",
    "waitlists:delete <id-or-slug>": "delete a waitlist and all signups",
    "signups:list <id-or-slug> [--limit <n>] [--offset <n>]": "list signups by position",
    "signups:add <id-or-slug> --email <email> [--ref <code>]": "add a signup directly",
    "stats <id-or-slug>": "signup totals, 24h/7d, top referrers",
    "export <id-or-slug> [--format csv|json]": "export all signups (csv prints raw CSV)",
  },
};

function out(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function fail(error, extra = {}) {
  console.log(JSON.stringify({ ok: false, error, ...extra }, null, 2));
  process.exit(1);
}

async function api(method, path, body, { raw = false } = {}) {
  if (!API_KEY) fail("WAITLOOP_API_KEY is not set", { help: HELP.auth });
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    fail(`could not reach ${API_URL}: ${err.message}`, { help: HELP.endpoint });
  }
  if (raw && res.ok) return await res.text();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(data.error || `HTTP ${res.status}`, { status: res.status });
  return data;
}

function themeFromFlags(v) {
  const theme = {};
  if (v.headline) theme.headline = v.headline;
  if (v.description) theme.description = v.description;
  if (v.button) theme.buttonText = v.button;
  if (v.success) theme.successMessage = v.success;
  if (v.accent) theme.accentColor = v.accent;
  if (v.background) theme.background = v.background;
  if (v.logo) theme.logoUrl = v.logo;
  return Object.keys(theme).length ? theme : undefined;
}

const [command, ...rest] = process.argv.slice(2);

const { values: v, positionals } = parseArgs({
  args: rest,
  allowPositionals: true,
  options: {
    name: { type: "string" },
    slug: { type: "string" },
    headline: { type: "string" },
    description: { type: "string" },
    button: { type: "string" },
    success: { type: "string" },
    accent: { type: "string" },
    background: { type: "string" },
    logo: { type: "string" },
    webhook: { type: "string" },
    "no-referrals": { type: "boolean" },
    email: { type: "string" },
    ref: { type: "string" },
    limit: { type: "string" },
    offset: { type: "string" },
    format: { type: "string" },
  },
});

const id = positionals[0];
const needId = () => {
  if (!id) fail(`this command needs a waitlist id or slug: waitloop ${command} <id-or-slug>`);
  return encodeURIComponent(id);
};

switch (command) {
  case undefined:
  case "help":
  case "--help":
  case "-h":
    out({ ok: true, ...HELP });
    break;

  case "me":
    out({ ok: true, ...(await api("GET", "/api/v1/me")) });
    break;

  case "waitlists:list":
    out({ ok: true, ...(await api("GET", "/api/v1/waitlists")) });
    break;

  case "waitlists:create": {
    if (!v.name) fail("--name is required");
    const body = {
      name: v.name,
      ...(v.slug && { slug: v.slug }),
      ...(themeFromFlags(v) && { theme: themeFromFlags(v) }),
      ...(v["no-referrals"] && { referralsEnabled: false }),
      ...(v.webhook && { webhookUrl: v.webhook }),
    };
    out({ ok: true, ...(await api("POST", "/api/v1/waitlists", body)) });
    break;
  }

  case "waitlists:get":
    out({ ok: true, ...(await api("GET", `/api/v1/waitlists/${needId()}`)) });
    break;

  case "waitlists:update": {
    const body = {
      ...(v.name && { name: v.name }),
      ...(v.slug && { slug: v.slug }),
      ...(themeFromFlags(v) && { theme: themeFromFlags(v) }),
      ...(v["no-referrals"] && { referralsEnabled: false }),
      ...(v.webhook && { webhookUrl: v.webhook }),
    };
    out({ ok: true, ...(await api("PATCH", `/api/v1/waitlists/${needId()}`, body)) });
    break;
  }

  case "waitlists:delete":
    out({ ok: true, ...(await api("DELETE", `/api/v1/waitlists/${needId()}`)) });
    break;

  case "signups:list": {
    const q = new URLSearchParams();
    if (v.limit) q.set("limit", v.limit);
    if (v.offset) q.set("offset", v.offset);
    const qs = q.toString() ? `?${q}` : "";
    out({ ok: true, ...(await api("GET", `/api/v1/waitlists/${needId()}/signups${qs}`)) });
    break;
  }

  case "signups:add": {
    if (!v.email) fail("--email is required");
    const body = { email: v.email, ...(v.ref && { referredByCode: v.ref }) };
    out({ ok: true, ...(await api("POST", `/api/v1/waitlists/${needId()}/signups`, body)) });
    break;
  }

  case "stats":
    out({ ok: true, ...(await api("GET", `/api/v1/waitlists/${needId()}/stats`)) });
    break;

  case "export": {
    const format = v.format || "json";
    if (format === "csv") {
      const csv = await api("GET", `/api/v1/waitlists/${needId()}/signups/export?format=csv`, null, {
        raw: true,
      });
      process.stdout.write(csv);
    } else {
      out({ ok: true, ...(await api("GET", `/api/v1/waitlists/${needId()}/signups/export`)) });
    }
    break;
  }

  default:
    fail(`unknown command: ${command}`, { help: HELP });
}
