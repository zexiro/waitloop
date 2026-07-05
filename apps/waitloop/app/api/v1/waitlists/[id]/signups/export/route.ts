import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getWaitlist, listSignups } from "@/lib/waitlists";

type Ctx = { params: Promise<{ id: string }> };

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET = withApiAuth<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const w = await getWaitlist(user.id, id);
  const rows = await listSignups(w, { limit: 1000000 });
  const format = new URL(req.url).searchParams.get("format") ?? "json";

  if (format === "csv") {
    const header = "email,position,referral_code,referral_count,created_at";
    const lines = rows.map((r) =>
      [r.email, r.position, r.referralCode, r.referralCount, r.createdAt.toISOString()]
        .map(csvEscape)
        .join(","),
    );
    return new Response([header, ...lines].join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${w.slug}-signups.csv"`,
      },
    });
  }
  return NextResponse.json({ signups: rows, total: rows.length });
});
