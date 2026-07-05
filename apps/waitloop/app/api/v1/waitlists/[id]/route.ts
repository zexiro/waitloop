import { NextResponse } from "next/server";
import { withApiAuth, waitlistPatchSchema } from "@/lib/api";
import { deleteWaitlist, getWaitlist, updateWaitlist } from "@/lib/waitlists";
import { appUrl } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApiAuth<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const w = await getWaitlist(user.id, id);
  return NextResponse.json({ waitlist: { ...w, pageUrl: `${appUrl()}/w/${w.slug}` } });
});

export const PATCH = withApiAuth<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const patch = waitlistPatchSchema.parse(await req.json());
  const w = await updateWaitlist(user.id, id, patch);
  return NextResponse.json({ waitlist: { ...w, pageUrl: `${appUrl()}/w/${w.slug}` } });
});

export const DELETE = withApiAuth<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  await deleteWaitlist(user.id, id);
  return NextResponse.json({ ok: true });
});
