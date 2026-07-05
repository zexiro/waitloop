import { notFound } from "next/navigation";
import { getSessionUser, appUrl } from "@/lib/auth";
import { getStats, getWaitlist, listSignups, ApiError } from "@/lib/waitlists";
import { deleteWaitlistAction } from "../../actions";

export default async function WaitlistDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = (await getSessionUser())!;
  const { slug } = await params;
  let w;
  try {
    w = await getWaitlist(user.id, slug);
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }
  const [stats, signups] = await Promise.all([getStats(w), listSignups(w, { limit: 200 })]);

  const stat = (label: string, value: number | string) => (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--ink-line)", background: "var(--ink-surface)" }}
    >
      <div className="font-mono text-xl font-semibold" style={{ color: "var(--accent)" }}>
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider opacity-50 mt-1">{label}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{w.name}</h1>
          <a
            href={`/w/${w.slug}`}
            target="_blank"
            className="font-mono text-xs opacity-60 hover:opacity-100 underline underline-offset-4"
          >
            {appUrl()}/w/{w.slug} ↗
          </a>
        </div>
        <div className="flex gap-3 items-center">
          <a
            href={`/api/v1/waitlists/${w.id}/signups/export?format=csv`}
            className="text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            Export CSV
          </a>
          <form action={deleteWaitlistAction}>
            <input type="hidden" name="id" value={w.id} />
            <button
              type="submit"
              className="text-sm opacity-60 hover:opacity-100 cursor-pointer underline underline-offset-4"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stat("total", stats.total)}
        {stat("last 24h", stats.last24h)}
        {stat("last 7 days", stats.last7d)}
        {stat("referred", stats.referred)}
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wider opacity-50 mb-3">Signups</h2>
        {signups.length === 0 ? (
          <p className="text-sm opacity-60">
            No signups yet. Share the page URL above to start the line.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--ink-line)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left font-mono text-[11px] uppercase tracking-wider opacity-50"
                  style={{ background: "var(--ink-surface)" }}
                >
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Referrals</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "var(--ink-line)" }}>
                    <td className="px-4 py-2 font-mono opacity-60">{s.position}</td>
                    <td className="px-4 py-2">{s.email}</td>
                    <td className="px-4 py-2 font-mono">{s.referralCount}</td>
                    <td className="px-4 py-2 opacity-60">
                      {s.createdAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
