import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { ApiError, addSignup, getWaitlistBySlug, updateSignupAvatar } from "@/lib/waitlists";
import { normalizeAvatarPatch } from "@/lib/avatars";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

const avatarSchema = z
  .object({
    expression: z.string().optional(),
    accessory: z.string().optional(),
    color: z.string().optional(),
  })
  .optional();

const postSchema = z.object({
  email: z.string(),
  ref: z.string().optional(),
  avatar: avatarSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function parseAvatar(input: unknown) {
  if (input === undefined) return undefined;
  try {
    return normalizeAvatarPatch(input);
  } catch (err) {
    throw new ApiError(400, err instanceof Error ? err.message : "invalid avatar");
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const w = await getWaitlistBySlug(slug);
    if (!w) return NextResponse.json({ error: "waitlist not found" }, { status: 404, headers: CORS });
    const input = postSchema.parse(await req.json());
    const { signup, created } = await addSignup(w, input.email, {
      referredByCode: input.ref,
      metadata: input.metadata,
      avatar: w.avatarsEnabled ? parseAvatar(input.avatar) : undefined,
    });
    return NextResponse.json(
      {
        created,
        position: signup.position,
        referralUrl: signup.referralUrl,
        referralCode: signup.referralCode,
        avatar: signup.avatar,
        earned: signup.earned,
        successMessage: w.theme.successMessage ?? "You're on the list!",
      },
      { status: created ? 201 : 200, headers: CORS },
    );
  } catch (err) {
    const res = errorResponse(err);
    Object.entries(CORS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

const patchSchema = z.object({
  code: z.string(),
  avatar: z.object({
    expression: z.string().optional(),
    accessory: z.string().optional(),
    color: z.string().optional(),
  }),
});

/** Update your queue avatar. Identified by your referral code — no account needed. */
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const w = await getWaitlistBySlug(slug);
    if (!w) return NextResponse.json({ error: "waitlist not found" }, { status: 404, headers: CORS });
    if (!w.avatarsEnabled)
      return NextResponse.json({ error: "avatars are disabled for this waitlist" }, { status: 400, headers: CORS });
    const input = patchSchema.parse(await req.json());
    const patch = parseAvatar(input.avatar);
    const signup = await updateSignupAvatar(w, input.code, patch ?? {});
    return NextResponse.json(
      { position: signup.position, avatar: signup.avatar, earned: signup.earned },
      { headers: CORS },
    );
  } catch (err) {
    const res = errorResponse(err);
    Object.entries(CORS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
