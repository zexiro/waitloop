import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api";
import { addSignup, getWaitlist, listSignups } from "@/lib/waitlists";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApiAuth<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const w = await getWaitlist(user.id, id);
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const rows = await listSignups(w, { limit, offset });
  return NextResponse.json({ signups: rows, limit, offset });
});

const addSchema = z.object({
  email: z.string(),
  referredByCode: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withApiAuth<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const w = await getWaitlist(user.id, id);
  const input = addSchema.parse(await req.json());
  const { signup, created } = await addSignup(w, input.email, {
    referredByCode: input.referredByCode,
    metadata: input.metadata,
  });
  return NextResponse.json({ signup, created }, { status: created ? 201 : 200 });
});
