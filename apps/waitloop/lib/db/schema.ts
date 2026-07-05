import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const magicLinkTokens = pgTable("magic_link_tokens", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    prefix: text("prefix").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("api_keys_user_idx").on(t.userId)],
);

export type WaitlistTheme = {
  headline?: string;
  description?: string;
  buttonText?: string;
  successMessage?: string;
  logoUrl?: string;
  accentColor?: string;
  background?: "dark" | "light";
};

export const waitlists = pgTable(
  "waitlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    theme: jsonb("theme").$type<WaitlistTheme>().notNull().default({}),
    referralsEnabled: boolean("referrals_enabled").notNull().default(true),
    avatarsEnabled: boolean("avatars_enabled").notNull().default(true),
    webhookUrl: text("webhook_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("waitlists_user_idx").on(t.userId)],
);

export const signups = pgTable(
  "signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    waitlistId: uuid("waitlist_id")
      .notNull()
      .references(() => waitlists.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    referralCode: text("referral_code").notNull().unique(),
    referredBy: uuid("referred_by"),
    referralCount: integer("referral_count").notNull().default(0),
    // Customized queue avatar; null means "wear the face dealt from the referral code".
    avatar: jsonb("avatar").$type<Partial<import("../avatars").Avatar>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("signups_waitlist_email_idx").on(t.waitlistId, t.email),
    index("signups_waitlist_idx").on(t.waitlistId),
    index("signups_rank_idx").on(t.waitlistId, t.referralCount, t.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Waitlist = typeof waitlists.$inferSelect;
export type Signup = typeof signups.$inferSelect;
