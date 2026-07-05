import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { addSignup, getWaitlistBySlug } from "@/lib/waitlists";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

const schema = z.object({
  email: z.string(),
  ref: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const w = await getWaitlistBySlug(slug);
    if (!w) return NextResponse.json({ error: "waitlist not found" }, { status: 404, headers: CORS });
    const input = schema.parse(await req.json());
    const { signup, created } = await addSignup(w, input.email, {
      referredByCode: input.ref,
      metadata: input.metadata,
    });
    return NextResponse.json(
      {
        created,
        position: signup.position,
        referralUrl: signup.referralUrl,
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
