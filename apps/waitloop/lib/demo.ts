import { eq } from "drizzle-orm";
import { getDb, users, waitlists, signups, type Waitlist } from "./db";
import { createWaitlist } from "./waitlists";

export const DEMO_SLUG = "moonbase-espresso";
const DEMO_OWNER_EMAIL = "demo@waitloop.internal";

const FIRST_NAMES = [
  "ada", "grace", "alan", "edsger", "barbara", "donald", "radia", "vint",
  "margaret", "linus", "katherine", "dennis", "frances", "ken", "annie",
  "gordon", "hedy", "claude", "ida", "seymour", "mary", "john", "joan",
  "niklaus", "adele", "bjarne", "erna", "guido", "sophie", "james",
  "thelma", "brian", "kathleen", "rob", "evelyn", "tony", "jean", "rich",
];

/**
 * The demo waitlist shown on the landing page. Created lazily on first view
 * (so self-hosted instances get one too) and seeded with a believable line.
 */
export async function getOrCreateDemoWaitlist(): Promise<Waitlist> {
  const db = await getDb();
  const [existing] = await db.select().from(waitlists).where(eq(waitlists.slug, DEMO_SLUG));
  if (existing) return existing;

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
        "A demo waitlist for a product that doesn't exist (yet). Join it with any email — you'll get a ticket with your place in line and a referral link that moves you up.",
      buttonText: "Save my spot",
      successMessage: "Welcome aboard the moonbase.",
      accentColor: "#7c5cff",
      background: "light",
    },
  });

  // Seed a believable line: staggered join times, a few active referrers.
  const now = Date.now();
  const rows = FIRST_NAMES.map((name, i) => ({
    waitlistId: w.id,
    email: `${name}@example.com`,
    referralCode: `demo${String(i).padStart(4, "0")}`,
    referralCount: i % 9 === 0 ? 4 : i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
    createdAt: new Date(now - (FIRST_NAMES.length - i) * 5 * 60 * 60 * 1000),
  }));
  await db.insert(signups).values(rows).onConflictDoNothing();

  return w;
}
