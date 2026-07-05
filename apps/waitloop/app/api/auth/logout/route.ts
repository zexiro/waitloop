import { NextResponse } from "next/server";
import { appUrl, destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(`${appUrl()}/login`, 303);
}
