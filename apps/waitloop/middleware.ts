import { NextResponse, type NextRequest } from "next/server";

// Serve every docs page as raw markdown at /docs/<slug>.md
export function middleware(req: NextRequest) {
  const match = req.nextUrl.pathname.match(/^\/docs\/([a-z0-9-]+)\.md$/);
  if (match) {
    return NextResponse.rewrite(new URL(`/api/docs-md/${match[1]}`, req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/docs/:path*" };
