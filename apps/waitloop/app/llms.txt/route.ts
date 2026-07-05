import { listDocs } from "@/lib/docs";
import { appUrl } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const docs = await listDocs();
  const base = appUrl();
  const body = `# Waitloop

> Agent-first waitlists: hosted signup pages with referral ranking, operated via MCP server, JSON-first CLI, and REST API. One API key (wl_...) unlocks all three. MCP endpoint: ${base}/api/mcp (streamable HTTP, Bearer auth).

## Docs

${docs
  .map(
    (d) =>
      `- [${d.title}](${base}/docs/${d.slug === "index" ? "index" : d.slug}.md)`,
  )
  .join("\n")}

## Key facts

- Create a waitlist: MCP tool create_waitlist, CLI \`npx waitloop waitlists:create --name "..."\`, or POST ${base}/api/v1/waitlists
- Waitlists are referenced by UUID or slug everywhere
- Public signup endpoint (no auth, CORS-open): POST ${base}/api/public/w/<slug>/signups with {"email": "..."}
- Hosted pages live at ${base}/w/<slug>; referral links append ?ref=<code>
- Open source (AGPL-3.0), self-hostable: https://github.com/zexiro/waitloop
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
