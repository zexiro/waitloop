import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";

export const GET = withApiAuth(async (_req, user) => {
  return NextResponse.json({ user: { id: user.id, email: user.email } });
});
