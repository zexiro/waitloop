import { NextResponse } from "next/server";
import { appUrl, createSession, verifyMagicLink } from "@/lib/auth";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const user = token ? await verifyMagicLink(token) : null;
  if (!user) {
    return NextResponse.redirect(`${appUrl()}/login?error=invalid_link`);
  }
  await createSession(user.id);
  return NextResponse.redirect(`${appUrl()}/dashboard`);
}
