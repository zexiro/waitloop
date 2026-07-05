import { appUrl } from "./auth";
import {
  addSignup,
  createWaitlist,
  deleteWaitlist,
  getStats,
  getWaitlist,
  listSignups,
  listWaitlists,
  updateWaitlist,
} from "./waitlists";
import type { User } from "./db";

type JsonSchema = Record<string, unknown>;

export type McpTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler: (user: User, args: Record<string, unknown>) => Promise<unknown>;
};

const themeProps: JsonSchema = {
  type: "object",
  description: "Visual customization of the hosted waitlist page",
  properties: {
    headline: { type: "string", description: "Main headline on the page" },
    description: { type: "string", description: "Supporting copy under the headline" },
    buttonText: { type: "string", description: "Submit button label (default: 'Join the waitlist')" },
    successMessage: { type: "string", description: "Message shown after signing up" },
    logoUrl: { type: "string", description: "URL of a logo image to show above the headline" },
    accentColor: { type: "string", description: "Hex accent color, e.g. #6c5ce7" },
    background: { type: "string", enum: ["dark", "light"], description: "Page color scheme (default dark)" },
  },
  additionalProperties: false,
};

const idParam: JsonSchema = {
  type: "string",
  description: "Waitlist id (UUID) or slug",
};

function summarize(w: {
  id: string;
  slug: string;
  name: string;
  referralsEnabled: boolean;
  webhookUrl: string | null;
}) {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    pageUrl: `${appUrl()}/w/${w.slug}`,
    referralsEnabled: w.referralsEnabled,
    webhookUrl: w.webhookUrl,
  };
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: "list_waitlists",
    description: "List all waitlists in this account, with signup counts and hosted page URLs.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (user) => ({
      waitlists: (await listWaitlists(user.id)).map((w) => ({
        ...summarize(w),
        signupCount: w.signupCount,
      })),
    }),
  },
  {
    name: "create_waitlist",
    description:
      "Create a waitlist with a hosted signup page. Returns the public page URL immediately — the page is live as soon as this call returns. Referral links are enabled by default: every signup gets a unique link that moves them up the list when others join through it.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Internal name, also used to derive the slug" },
        slug: { type: "string", description: "Optional custom URL slug (lowercase, hyphens)" },
        theme: themeProps,
        referralsEnabled: { type: "boolean", description: "Enable referral ranking (default true)" },
        webhookUrl: { type: "string", description: "URL to POST signup.created events to" },
      },
      required: ["name"],
      additionalProperties: false,
    },
    handler: async (user, args) => ({
      waitlist: summarize(await createWaitlist(user.id, args as never)),
    }),
  },
  {
    name: "update_waitlist",
    description: "Update a waitlist's name, slug, theme, referral setting, or webhook URL. Theme fields are merged, not replaced.",
    inputSchema: {
      type: "object",
      properties: {
        id: idParam,
        name: { type: "string" },
        slug: { type: "string" },
        theme: themeProps,
        referralsEnabled: { type: "boolean" },
        webhookUrl: { type: ["string", "null"], description: "Set null to remove" },
      },
      required: ["id"],
      additionalProperties: false,
    },
    handler: async (user, { id, ...patch }) => ({
      waitlist: summarize(await updateWaitlist(user.id, id as string, patch as never)),
    }),
  },
  {
    name: "delete_waitlist",
    description: "Permanently delete a waitlist and all of its signups. This cannot be undone.",
    inputSchema: {
      type: "object",
      properties: { id: idParam },
      required: ["id"],
      additionalProperties: false,
    },
    handler: async (user, { id }) => {
      await deleteWaitlist(user.id, id as string);
      return { ok: true };
    },
  },
  {
    name: "get_stats",
    description:
      "Get signup stats for a waitlist: total, last 24h, last 7 days, referred count, and top referrers.",
    inputSchema: {
      type: "object",
      properties: { id: idParam },
      required: ["id"],
      additionalProperties: false,
    },
    handler: async (user, { id }) => {
      const w = await getWaitlist(user.id, id as string);
      return { waitlist: { id: w.id, slug: w.slug, name: w.name }, stats: await getStats(w) };
    },
  },
  {
    name: "list_signups",
    description:
      "List signups for a waitlist ordered by position (referral count desc, then signup time). Paginate with limit/offset.",
    inputSchema: {
      type: "object",
      properties: {
        id: idParam,
        limit: { type: "number", description: "Max rows to return (default 100, max 1000)" },
        offset: { type: "number", description: "Rows to skip (default 0)" },
      },
      required: ["id"],
      additionalProperties: false,
    },
    handler: async (user, { id, limit, offset }) => {
      const w = await getWaitlist(user.id, id as string);
      return {
        signups: await listSignups(w, {
          limit: (limit as number) ?? 100,
          offset: (offset as number) ?? 0,
        }),
      };
    },
  },
  {
    name: "export_signups",
    description: "Export every signup of a waitlist as CSV (email, position, referral code, referral count, created_at).",
    inputSchema: {
      type: "object",
      properties: { id: idParam },
      required: ["id"],
      additionalProperties: false,
    },
    handler: async (user, { id }) => {
      const w = await getWaitlist(user.id, id as string);
      const rows = await listSignups(w, { limit: 1000000 });
      const csv = [
        "email,position,referral_code,referral_count,created_at",
        ...rows.map((r) =>
          [r.email, r.position, r.referralCode, r.referralCount, r.createdAt.toISOString()].join(","),
        ),
      ].join("\n");
      return { format: "csv", total: rows.length, csv };
    },
  },
  {
    name: "add_signup",
    description:
      "Add a signup directly (e.g. importing an existing list or signing someone up on their behalf). Deduplicates by email; returns the signup's position and referral URL.",
    inputSchema: {
      type: "object",
      properties: {
        id: idParam,
        email: { type: "string" },
        referredByCode: { type: "string", description: "Referral code of the signup who referred them" },
        metadata: { type: "object", description: "Arbitrary JSON stored with the signup" },
      },
      required: ["id", "email"],
      additionalProperties: false,
    },
    handler: async (user, { id, email, referredByCode, metadata }) => {
      const w = await getWaitlist(user.id, id as string);
      return await addSignup(w, email as string, {
        referredByCode: referredByCode as string | undefined,
        metadata: metadata as Record<string, unknown> | undefined,
      });
    },
  },
];
