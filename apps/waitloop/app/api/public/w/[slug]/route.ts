import { NextResponse } from "next/server";
import { appUrl } from "@/lib/auth";
import { getQueueFront, getWaitlistBySlug } from "@/lib/waitlists";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/**
 * Public read for embeds and integrations (e.g. link-in-bio waitlist blocks):
 * the waitlist's headline, live count, and front-of-queue avatars. No emails,
 * referral codes, or owner data — everything here is already visible on the
 * hosted page.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await getWaitlistBySlug(slug);
  if (!w) {
    return NextResponse.json({ error: "waitlist not found" }, { status: 404, headers: CORS });
  }
  const queue = await getQueueFront(w, 8);
  return NextResponse.json(
    {
      slug: w.slug,
      name: w.name,
      pageUrl: `${appUrl()}/w/${w.slug}`,
      theme: {
        headline: w.theme.headline ?? w.name,
        description: w.theme.description ?? null,
        buttonText: w.theme.buttonText ?? "Join the waitlist",
        accentColor: w.theme.accentColor ?? null,
        background: w.theme.background ?? "light",
      },
      referralsEnabled: w.referralsEnabled,
      avatarsEnabled: w.avatarsEnabled,
      total: queue.total,
      ...(w.avatarsEnabled ? { front: queue.front } : {}),
    },
    { headers: { ...CORS, "Cache-Control": "public, max-age=30" } },
  );
}
