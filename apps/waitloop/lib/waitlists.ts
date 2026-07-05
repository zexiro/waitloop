import { randomBytes } from "node:crypto";
import { and, count, desc, eq, gte, lt, or, sql } from "drizzle-orm";
import {
  getDb,
  waitlists,
  signups,
  type Waitlist,
  type Signup,
  type WaitlistTheme,
} from "./db";
import { appUrl } from "./auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
function shortCode(len = 8) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "waitlist"
  );
}

export type WaitlistInput = {
  name: string;
  slug?: string;
  theme?: WaitlistTheme;
  referralsEnabled?: boolean;
  webhookUrl?: string | null;
};

export async function createWaitlist(userId: string, input: WaitlistInput): Promise<Waitlist> {
  const db = await getDb();
  let slug = input.slug ? slugify(input.slug) : slugify(input.name);
  const [taken] = await db.select({ id: waitlists.id }).from(waitlists).where(eq(waitlists.slug, slug));
  if (taken) {
    if (input.slug) throw new ApiError(409, `slug "${slug}" is already taken`);
    slug = `${slug}-${shortCode(4)}`;
  }
  const [row] = await db
    .insert(waitlists)
    .values({
      userId,
      name: input.name,
      slug,
      theme: input.theme ?? {},
      referralsEnabled: input.referralsEnabled ?? true,
      webhookUrl: input.webhookUrl ?? null,
    })
    .returning();
  return row;
}

export async function listWaitlists(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({ waitlist: waitlists, signupCount: count(signups.id) })
    .from(waitlists)
    .leftJoin(signups, eq(signups.waitlistId, waitlists.id))
    .where(eq(waitlists.userId, userId))
    .groupBy(waitlists.id)
    .orderBy(desc(waitlists.createdAt));
  return rows.map((r) => ({ ...r.waitlist, signupCount: Number(r.signupCount) }));
}

/** Look up by UUID or slug, enforcing ownership. */
export async function getWaitlist(userId: string, idOrSlug: string): Promise<Waitlist> {
  const db = await getDb();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const [row] = await db
    .select()
    .from(waitlists)
    .where(isUuid ? eq(waitlists.id, idOrSlug) : eq(waitlists.slug, idOrSlug));
  if (!row || row.userId !== userId) throw new ApiError(404, "waitlist not found");
  return row;
}

export async function getWaitlistBySlug(slug: string): Promise<Waitlist | null> {
  const db = await getDb();
  const [row] = await db.select().from(waitlists).where(eq(waitlists.slug, slug));
  return row ?? null;
}

export async function updateWaitlist(
  userId: string,
  idOrSlug: string,
  patch: Partial<WaitlistInput>,
): Promise<Waitlist> {
  const db = await getDb();
  const existing = await getWaitlist(userId, idOrSlug);
  if (patch.slug && slugify(patch.slug) !== existing.slug) {
    const s = slugify(patch.slug);
    const [taken] = await db.select({ id: waitlists.id }).from(waitlists).where(eq(waitlists.slug, s));
    if (taken) throw new ApiError(409, `slug "${s}" is already taken`);
  }
  const [row] = await db
    .update(waitlists)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.slug !== undefined && { slug: slugify(patch.slug) }),
      ...(patch.theme !== undefined && { theme: { ...existing.theme, ...patch.theme } }),
      ...(patch.referralsEnabled !== undefined && { referralsEnabled: patch.referralsEnabled }),
      ...(patch.webhookUrl !== undefined && { webhookUrl: patch.webhookUrl }),
      updatedAt: new Date(),
    })
    .where(eq(waitlists.id, existing.id))
    .returning();
  return row;
}

export async function deleteWaitlist(userId: string, idOrSlug: string) {
  const db = await getDb();
  const existing = await getWaitlist(userId, idOrSlug);
  await db.delete(waitlists).where(eq(waitlists.id, existing.id));
}

// --- signups ---

async function positionOf(w: Waitlist, s: Signup): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ ahead: count() })
    .from(signups)
    .where(
      and(
        eq(signups.waitlistId, w.id),
        or(
          sql`${signups.referralCount} > ${s.referralCount}`,
          and(eq(signups.referralCount, s.referralCount), lt(signups.createdAt, s.createdAt)),
        ),
      ),
    );
  return Number(row.ahead) + 1;
}

export function publicSignupView(w: Waitlist, s: Signup, position: number) {
  return {
    id: s.id,
    email: s.email,
    position,
    referralCode: s.referralCode,
    referralCount: s.referralCount,
    referralUrl: `${appUrl()}/w/${w.slug}?ref=${s.referralCode}`,
    createdAt: s.createdAt,
  };
}

export async function addSignup(
  w: Waitlist,
  email: string,
  opts: { referredByCode?: string; metadata?: Record<string, unknown> } = {},
) {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new ApiError(400, "invalid email");

  const [existing] = await db
    .select()
    .from(signups)
    .where(and(eq(signups.waitlistId, w.id), eq(signups.email, normalized)));
  if (existing) {
    return { signup: publicSignupView(w, existing, await positionOf(w, existing)), created: false };
  }

  let referredBy: string | null = null;
  if (opts.referredByCode && w.referralsEnabled) {
    const [referrer] = await db
      .select()
      .from(signups)
      .where(and(eq(signups.waitlistId, w.id), eq(signups.referralCode, opts.referredByCode)));
    if (referrer) referredBy = referrer.id;
  }

  const [row] = await db
    .insert(signups)
    .values({
      waitlistId: w.id,
      email: normalized,
      referralCode: shortCode(),
      referredBy,
      metadata: opts.metadata ?? {},
    })
    .returning();

  if (referredBy) {
    await db
      .update(signups)
      .set({ referralCount: sql`${signups.referralCount} + 1` })
      .where(eq(signups.id, referredBy));
  }

  fireWebhook(w, row).catch((err) => console.error("webhook failed:", err.message));

  return { signup: publicSignupView(w, row, await positionOf(w, row)), created: true };
}

async function fireWebhook(w: Waitlist, s: Signup) {
  if (!w.webhookUrl) return;
  await fetch(w.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "signup.created",
      waitlist: { id: w.id, slug: w.slug, name: w.name },
      signup: { id: s.id, email: s.email, referralCode: s.referralCode, createdAt: s.createdAt },
    }),
    signal: AbortSignal.timeout(5000),
  });
}

export async function listSignups(
  w: Waitlist,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(signups)
    .where(eq(signups.waitlistId, w.id))
    .orderBy(desc(signups.referralCount), signups.createdAt)
    .limit(Math.min(limit, 1000))
    .offset(offset);
  return rows.map((s, i) => ({
    id: s.id,
    email: s.email,
    position: offset + i + 1,
    referralCode: s.referralCode,
    referralCount: s.referralCount,
    referredBy: s.referredBy,
    metadata: s.metadata,
    createdAt: s.createdAt,
  }));
}

export async function getStats(w: Waitlist) {
  const db = await getDb();
  const now = Date.now();
  const [totals] = await db
    .select({
      total: count(),
      last24h: count(sql`CASE WHEN ${signups.createdAt} >= ${new Date(now - 864e5)} THEN 1 END`),
      last7d: count(sql`CASE WHEN ${signups.createdAt} >= ${new Date(now - 7 * 864e5)} THEN 1 END`),
      referred: count(signups.referredBy),
    })
    .from(signups)
    .where(eq(signups.waitlistId, w.id));
  const topReferrers = await db
    .select({ email: signups.email, referralCount: signups.referralCount })
    .from(signups)
    .where(and(eq(signups.waitlistId, w.id), gte(signups.referralCount, 1)))
    .orderBy(desc(signups.referralCount))
    .limit(10);
  return {
    total: Number(totals.total),
    last24h: Number(totals.last24h),
    last7d: Number(totals.last7d),
    referred: Number(totals.referred),
    topReferrers,
    pageUrl: `${appUrl()}/w/${w.slug}`,
  };
}
