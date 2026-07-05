import { and, eq, like, notInArray } from "drizzle-orm";
import { getDb, users, waitlists, signups, type Waitlist } from "./db";
import { createWaitlist } from "./waitlists";
import type { Avatar } from "./avatars";

export const DEMO_SLUG = "moonbase-espresso";
const DEMO_OWNER_EMAIL = "demo@waitloop.internal";

const FIRST_NAMES = [
  "ada", "grace", "alan", "edsger", "barbara", "donald", "radia", "vint",
  "margaret", "linus", "katherine", "dennis", "frances", "ken", "annie",
  "gordon", "hedy", "claude", "ida", "seymour", "mary", "john", "joan",
  "niklaus", "adele", "bjarne", "erna", "guido", "sophie", "james",
  "thelma", "brian", "kathleen", "rob", "evelyn", "tony", "jean", "rich",
];

// A few seeded signups wear customized avatars so the front of the demo
// line shows the feature off; the rest wear their dealt default faces.
const SEED_AVATARS: Record<string, Partial<Avatar>> = {
  ada: { expression: "grin", accessory: "none", color: "#ffd166" },
  grace: { expression: "starry", accessory: "party", color: "#ffa1c3" },
  alan: { expression: "smile", accessory: "cap", color: "#8fd6a8" },
  barbara: { expression: "joy", accessory: "bow", color: "#b5aef0" },
  donald: { expression: "wink", accessory: "glasses", color: "#9ecbf5" },
  margaret: { expression: "joy", accessory: "none", color: "#ffb47a" },
  hedy: { expression: "smile", accessory: "bow", color: "#ffa1c3" },
  claude: { expression: "grin", accessory: "party", color: "#9ecbf5" },
};

// Referral counts that light up every earned item without drowning the queue
// in balloons: ada wears the golden glow (and the crown, holding #1), grace
// the pennant, and three balloons behind them.
const SEED_REFERRALS: Record<string, number> = {
  ada: 12,
  grace: 6,
  alan: 2,
  barbara: 1,
  hedy: 1,
};

/**
 * The demo waitlist shown on the landing page. Created lazily on first view
 * (so self-hosted instances get one too) and seeded with a believable line.
 */
export async function getOrCreateDemoWaitlist(): Promise<Waitlist> {
  const db = await getDb();
  const [existing] = await db.select().from(waitlists).where(eq(waitlists.slug, DEMO_SLUG));
  if (existing) {
    await ensureDemoShowcase();
    return existing;
  }

  let [owner] = await db.select().from(users).where(eq(users.email, DEMO_OWNER_EMAIL));
  if (!owner) {
    [owner] = await db.insert(users).values({ email: DEMO_OWNER_EMAIL }).returning();
  }

  const w = await createWaitlist(owner.id, {
    name: "Moonbase Espresso",
    slug: DEMO_SLUG,
    theme: {
      headline: "Espresso, engineered for low gravity",
      description:
        "A demo waitlist for a product that doesn't exist (yet). Join it with any email — you'll get a place in line, a queue avatar to dress up, and a referral link that moves you up.",
      buttonText: "Save my spot",
      successMessage: "Welcome aboard the moonbase.",
      background: "light",
    },
  });

  // Seed a believable line: staggered join times, a few active referrers.
  const now = Date.now();
  const rows = FIRST_NAMES.map((name, i) => ({
    waitlistId: w.id,
    email: `${name}@example.com`,
    referralCode: `demo${String(i).padStart(4, "0")}`,
    referralCount: SEED_REFERRALS[name] ?? 0,
    avatar: SEED_AVATARS[name] ?? null,
    createdAt: new Date(now - (FIRST_NAMES.length - i) * 5 * 60 * 60 * 1000),
  }));
  await db.insert(signups).values(rows).onConflictDoNothing();

  return w;
}

/**
 * Instances seeded before queue avatars existed have a flat demo line (every
 * front row wearing an identical balloon, no pennant or glow, no custom
 * faces). Re-shape the seed rows once; no-ops after that. Only rows with
 * `demo…` referral codes are touched — real signups keep their counts.
 */
async function ensureDemoShowcase() {
  const db = await getDb();
  const codeFor = (name: string) => `demo${String(FIRST_NAMES.indexOf(name)).padStart(4, "0")}`;
  const [probe] = await db
    .select({ referralCount: signups.referralCount, avatar: signups.avatar })
    .from(signups)
    .where(eq(signups.referralCode, codeFor("alan")));
  if (!probe || (probe.referralCount === SEED_REFERRALS.alan && probe.avatar)) return;

  const showcaseCodes = Object.keys(SEED_REFERRALS).map(codeFor);
  await db
    .update(signups)
    .set({ referralCount: 0 })
    .where(
      and(
        like(signups.referralCode, "demo____"),
        notInArray(signups.referralCode, showcaseCodes),
      ),
    );
  for (const [name, referralCount] of Object.entries(SEED_REFERRALS)) {
    await db.update(signups).set({ referralCount }).where(eq(signups.referralCode, codeFor(name)));
  }
  for (const [name, avatar] of Object.entries(SEED_AVATARS)) {
    await db.update(signups).set({ avatar }).where(eq(signups.referralCode, codeFor(name)));
  }
}
