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
          <h1 className="a-title">Waitlists</h1>
          <p className="a-sub">
            Agents can do all of this too — point them at{" "}
            <code className="a-code">{appUrl()}/api/mcp</code>
          </p>
        </div>
        <form action={createWaitlistAction} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="New waitlist name"
            className="q-input q-input--sm"
          />
          <button type="submit" className="q-btn q-btn--sm">
            Create
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="a-empty">
          No waitlists yet. Create one above — or ask your agent to:{" "}
          <code className="a-code">&quot;create a waitlist for my new project&quot;</code>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((w) => (
            <li key={w.id} className="a-card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/w/${w.slug}`}
                  className="font-bold hover:underline underline-offset-4"
                >
                  {w.name}
                </Link>
                <div className="a-muted font-mono text-xs mt-1 truncate">/w/{w.slug}</div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="a-stat-v">{w.signupCount}</div>
                  <div className="a-stat-l">in line</div>
                </div>
                <a href={`/w/${w.slug}`} target="_blank" className="a-link">
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
