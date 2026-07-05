import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getStats, getWaitlist } from "@/lib/waitlists";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApiAuth<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const w = await getWaitlist(user.id, id);
  const stats = await getStats(w);
  return NextResponse.json({ waitlist: { id: w.id, slug: w.slug, name: w.name }, stats });
});
