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
        <h1 className="a-title">API keys</h1>
        <p className="a-sub">One key unlocks the REST API, the MCP server, and the CLI.</p>
      </div>

      {newKey ? (
        <div className="a-card p-5 text-sm" style={{ border: "2px solid var(--q-accent)" }}>
          <div className="font-bold mb-2">
            Your new key — copy it now, it won&apos;t be shown again:
          </div>
          <code className="a-code break-all select-all">{newKey}</code>
          <div className="mt-4 grid gap-1 font-mono text-[11px] a-muted">
            <div>
              MCP: claude mcp add --transport http waitloop {appUrl()}/api/mcp --header
              &quot;Authorization: Bearer {newKey.slice(0, 11)}…&quot;
            </div>
            <div>CLI: WAITLOOP_API_KEY={newKey.slice(0, 11)}… npx waitloop-cli waitlists:list</div>
          </div>
        </div>
      ) : null}

      <form action={createKeyAction} className="flex gap-2">
        <input
          name="name"
          placeholder="Key name (e.g. claude-code)"
          className="q-input q-input--sm"
          style={{ flex: "0 1 18rem" }}
        />
        <button type="submit" className="q-btn q-btn--sm">
          Create key
        </button>
      </form>

      <ul className="grid gap-2">
        {rows.map((k) => (
          <li
            key={k.id}
            className="a-card px-4 py-3 flex items-center justify-between gap-4 text-sm"
          >
            <div>
              <span className="font-bold">{k.name}</span>{" "}
              <code className="a-code">{k.prefix}…</code>
              {k.revokedAt ? <span className="a-tag">revoked</span> : null}
            </div>
            {!k.revokedAt ? (
              <form action={revokeKeyAction}>
                <input type="hidden" name="id" value={k.id} />
                <button type="submit" className="a-link">
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
