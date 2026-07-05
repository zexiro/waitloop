import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, users, sessions, magicLinkTokens, apiKeys, type User } from "./db";
import { sendEmail } from "./email";

const SESSION_COOKIE = "waitloop_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const token = (bytes = 32) => randomBytes(bytes).toString("base64url");

export async function sendMagicLink(email: string) {
  const db = await getDb();
  const t = token();
  await db.insert(magicLinkTokens).values({
    token: sha256(t),
    email: email.toLowerCase(),
    expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
  });
  const url = `${appUrl()}/auth/verify?token=${t}`;
  await sendEmail(
    email,
    "Log in to Waitloop",
    `<p>Click to log in to Waitloop:</p><p><a href="${url}">${url}</a></p><p>This link expires in 15 minutes.</p>`,
  );
}

export async function verifyMagicLink(rawToken: string): Promise<User | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(magicLinkTokens)
    .where(and(eq(magicLinkTokens.token, sha256(rawToken)), isNull(magicLinkTokens.usedAt)));
  if (!row || row.expiresAt < new Date()) return null;
  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicLinkTokens.token, row.token));

  const [existing] = await db.select().from(users).where(eq(users.email, row.email));
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email: row.email }).returning();
  return created;
}

export async function createSession(userId: string) {
  const db = await getDb();
  const t = token();
  await db.insert(sessions).values({
    token: sha256(t),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, t, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl().startsWith("https"),
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const db = await getDb();
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.token, sha256(raw)));
  if (!row || row.expiresAt < new Date()) return null;
  return row.user;
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.token, sha256(raw)));
  }
  jar.delete(SESSION_COOKIE);
}

// --- API keys ---

export async function createApiKey(userId: string, name: string) {
  const db = await getDb();
  const raw = `wl_${token(24)}`;
  const [row] = await db
    .insert(apiKeys)
    .values({ userId, name, keyHash: sha256(raw), prefix: raw.slice(0, 11) })
    .returning();
  return { key: raw, record: row };
}

export async function revokeApiKey(userId: string, keyId: string) {
  const db = await getDb();
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

/** Authenticate a request via `Authorization: Bearer wl_...` (or `x-api-key`). */
export async function getApiKeyUser(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization") || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : req.headers.get("x-api-key");
  if (!raw || !raw.startsWith("wl_")) return null;
  const db = await getDb();
  const [row] = await db
    .select({ user: users, keyId: apiKeys.id })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .where(and(eq(apiKeys.keyHash, sha256(raw)), isNull(apiKeys.revokedAt)));
  if (!row) return null;
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.keyId))
    .catch(() => {});
  return row.user;
}
