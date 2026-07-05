import { NextResponse } from "next/server";
import { sendMagicLink } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  await sendMagicLink(email);
  return NextResponse.json({ ok: true, message: "magic link sent" });
}
