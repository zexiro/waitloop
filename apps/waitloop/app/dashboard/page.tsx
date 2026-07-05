import Link from "next/link";
import { getSessionUser, appUrl } from "@/lib/auth";
import { listWaitlists } from "@/lib/waitlists";
import { createWaitlistAction } from "./actions";

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const rows = await listWaitlists(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Waitlists</h1>
          <p className="text-sm opacity-60 mt-1">
            Agents can do all of this too — point them at{" "}
            <code className="font-mono text-xs">{appUrl()}/api/mcp</code>
          </p>
        </div>
        <form action={createWaitlistAction} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="New waitlist name"
            className="wl-input"
            style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}
            data-scheme="dark"
          />
          <button type="submit" className="wl-button" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            Create
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-lg border border-dashed p-10 text-center text-sm opacity-70"
          style={{ borderColor: "var(--ink-line)" }}
        >
          No waitlists yet. Create one above — or ask your agent to:{" "}
          <code className="font-mono text-xs">&quot;create a waitlist for my new project&quot;</code>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((w) => (
            <li
              key={w.id}
              className="rounded-lg border p-4 flex items-center justify-between gap-4"
              style={{ borderColor: "var(--ink-line)", background: "var(--ink-surface)" }}
            >
              <div className="min-w-0">
                <Link href={`/dashboard/w/${w.slug}`} className="font-semibold hover:underline">
                  {w.name}
                </Link>
                <div className="font-mono text-xs opacity-60 mt-1 truncate">/w/{w.slug}</div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="font-mono text-lg font-semibold" style={{ color: "var(--accent)" }}>
                    {w.signupCount}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider opacity-50">signups</div>
                </div>
                <a
                  href={`/w/${w.slug}`}
                  target="_blank"
                  className="text-sm opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  View page ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
