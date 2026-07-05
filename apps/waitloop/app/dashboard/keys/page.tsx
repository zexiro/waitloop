import { getSessionUser, appUrl } from "@/lib/auth";
import { getDb, apiKeys } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { createKeyAction, revokeKeyAction } from "../actions";

export default async function KeysPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = (await getSessionUser())!;
  const { new: newKey } = await searchParams;
  const db = await getDb();
  const rows = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(desc(apiKeys.createdAt));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">API keys</h1>
        <p className="text-sm opacity-60 mt-1">
          One key unlocks the REST API, the MCP server, and the CLI.
        </p>
      </div>

      {newKey ? (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{ borderColor: "var(--accent)", background: "var(--ink-surface)" }}
        >
          <div className="font-semibold mb-2">Your new key — copy it now, it won&apos;t be shown again:</div>
          <code className="font-mono text-xs break-all select-all">{newKey}</code>
          <div className="mt-4 grid gap-1 font-mono text-[11px] opacity-70">
            <div>MCP: claude mcp add --transport http waitloop {appUrl()}/api/mcp --header &quot;Authorization: Bearer {newKey.slice(0, 11)}…&quot;</div>
            <div>CLI: WAITLOOP_API_KEY={newKey.slice(0, 11)}… npx waitloop waitlists:list</div>
          </div>
        </div>
      ) : null}

      <form action={createKeyAction} className="flex gap-2">
        <input
          name="name"
          placeholder="Key name (e.g. claude-code)"
          className="wl-input"
          style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}
        />
        <button type="submit" className="wl-button" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
          Create key
        </button>
      </form>

      <ul className="grid gap-2">
        {rows.map((k) => (
          <li
            key={k.id}
            className="rounded-lg border px-4 py-3 flex items-center justify-between gap-4 text-sm"
            style={{ borderColor: "var(--ink-line)", background: "var(--ink-surface)" }}
          >
            <div>
              <span className="font-semibold">{k.name}</span>{" "}
              <code className="font-mono text-xs opacity-60">{k.prefix}…</code>
              {k.revokedAt ? (
                <span className="ml-2 text-xs uppercase tracking-wider opacity-50">revoked</span>
              ) : null}
            </div>
            {!k.revokedAt ? (
              <form action={revokeKeyAction}>
                <input type="hidden" name="id" value={k.id} />
                <button type="submit" className="text-xs opacity-70 hover:opacity-100 cursor-pointer underline underline-offset-4">
                  Revoke
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
