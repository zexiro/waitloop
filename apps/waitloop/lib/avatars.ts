/**
 * Queue avatars: the face a signup wears in the public queue.
 * Chosen by the signup (3 knobs) or dealt deterministically from their
 * referral code when they don't customize — so a signup's default face is
 * stable without storing anything.
 */

export const AVATAR_EXPRESSIONS = ["smile", "grin", "wink", "joy", "starry"] as const;
export const AVATAR_ACCESSORIES = ["none", "party", "cap", "bow", "glasses"] as const;
export const AVATAR_COLORS = [
  "#ffa1c3",
  "#ffd166",
  "#8fd6a8",
  "#9ecbf5",
  "#b5aef0",
  "#ffb47a",
] as const;

export type AvatarExpression = (typeof AVATAR_EXPRESSIONS)[number];
export type AvatarAccessory = (typeof AVATAR_ACCESSORIES)[number];

export type Avatar = {
  expression: AvatarExpression;
  accessory: AvatarAccessory;
  color: string;
};

/**
 * Earned items are computed, never stored or picked: the crown from holding
 * position #1, the rest from referral counts. Losing the spot loses the item.
 */
export const EARNED_ITEMS = [
  { key: "crown", name: "The Crown", rule: "hold #1" },
  { key: "balloon", name: "Balloon", rule: "1 referral", threshold: 1 },
  { key: "pennant", name: "Pennant", rule: "5 referrals", threshold: 5 },
  { key: "glow", name: "Golden Glow", rule: "10 referrals", threshold: 10 },
] as const;

export type EarnedItem = (typeof EARNED_ITEMS)[number]["key"];

export const MILESTONE_THRESHOLDS = [1, 5, 10] as const;

export function earnedItems(position: number, referralCount: number): EarnedItem[] {
  const items: EarnedItem[] = [];
  if (position === 1) items.push("crown");
  // Referral items don't stack visually — you wear the best one you've earned.
  if (referralCount >= 10) items.push("glow");
  else if (referralCount >= 5) items.push("pennant");
  else if (referralCount >= 1) items.push("balloon");
  return items;
}

export function milestoneReached(referralCount: number): number | null {
  return (MILESTONE_THRESHOLDS as readonly number[]).includes(referralCount)
    ? referralCount
    : null;
}

/** The item a referral milestone unlocks, for webhook payloads. */
export function milestoneItem(referralCount: number): EarnedItem | null {
  if (referralCount === 1) return "balloon";
  if (referralCount === 5) return "pennant";
  if (referralCount === 10) return "glow";
  return null;
}

/** FNV-1a — tiny, deterministic, and importable from client components. */
function fnv1a(input: string, seed: number): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Stable default face derived from the signup's referral code. */
export function defaultAvatar(referralCode: string): Avatar {
  // 'none' is weighted so accessories stay special in a long queue.
  const accessoryPool: readonly AvatarAccessory[] = [
    "none", "none", "none", "none", "none", "none",
    "party", "cap", "bow", "glasses",
  ];
  return {
    expression: AVATAR_EXPRESSIONS[fnv1a(referralCode, 1) % AVATAR_EXPRESSIONS.length],
    accessory: accessoryPool[fnv1a(referralCode, 2) % accessoryPool.length],
    color: AVATAR_COLORS[fnv1a(referralCode, 3) % AVATAR_COLORS.length],
  };
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Validate a partial avatar coming in from the public API; throws on bad values. */
export function normalizeAvatarPatch(input: unknown): Partial<Avatar> {
  if (typeof input !== "object" || input === null) throw new Error("avatar must be an object");
  const o = input as Record<string, unknown>;
  const out: Partial<Avatar> = {};
  if (o.expression !== undefined) {
    if (!AVATAR_EXPRESSIONS.includes(o.expression as AvatarExpression))
      throw new Error(`avatar.expression must be one of: ${AVATAR_EXPRESSIONS.join(", ")}`);
    out.expression = o.expression as AvatarExpression;
  }
  if (o.accessory !== undefined) {
    if (!AVATAR_ACCESSORIES.includes(o.accessory as AvatarAccessory))
      throw new Error(`avatar.accessory must be one of: ${AVATAR_ACCESSORIES.join(", ")}`);
    out.accessory = o.accessory as AvatarAccessory;
  }
  if (o.color !== undefined) {
    if (typeof o.color !== "string" || !HEX_COLOR.test(o.color))
      throw new Error("avatar.color must be a hex color like #ffa1c3");
    out.color = o.color.toLowerCase();
  }
  return out;
}

/** The face a signup wears: stored choices over the dealt default. */
export function resolveAvatar(
  stored: Partial<Avatar> | null | undefined,
  referralCode: string,
): Avatar {
  const dealt = defaultAvatar(referralCode);
  return {
    expression: stored?.expression ?? dealt.expression,
    accessory: stored?.accessory ?? dealt.accessory,
    color: stored?.color ?? dealt.color,
  };
}
