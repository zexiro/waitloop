import { NextResponse } from "next/server";
import { withApiAuth, waitlistInputSchema } from "@/lib/api";
import { createWaitlist, listWaitlists } from "@/lib/waitlists";
import { appUrl } from "@/lib/auth";

export const GET = withApiAuth(async (_req, user) => {
  const rows = await listWaitlists(user.id);
  return NextResponse.json({
    waitlists: rows.map((w) => ({ ...w, pageUrl: `${appUrl()}/w/${w.slug}` })),
  });
});

export const POST = withApiAuth(async (req, user) => {
  const input = waitlistInputSchema.parse(await req.json());
  const w = await createWaitlist(user.id, input);
  return NextResponse.json(
    { waitlist: { ...w, pageUrl: `${appUrl()}/w/${w.slug}` } },
    { status: 201 },
  );
});
