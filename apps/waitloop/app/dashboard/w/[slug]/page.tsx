import { notFound } from "next/navigation";
import { getSessionUser, appUrl } from "@/lib/auth";
import { getStats, getWaitlist, listSignups, ApiError } from "@/lib/waitlists";
import { QueueAvatar } from "@/components/queue-avatar";
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
    <div className="a-card a-stat">
      <div className="a-stat-v">{value}</div>
      <div className="a-stat-l">{label}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="a-title">{w.name}</h1>
          <a
            href={`/w/${w.slug}`}
            target="_blank"
            className="a-link font-mono"
            style={{ fontSize: "0.75rem" }}
          >
            {appUrl()}/w/{w.slug} ↗
          </a>
        </div>
        <div className="flex gap-4 items-center">
          <a href={`/api/v1/waitlists/${w.id}/signups/export?format=csv`} className="a-link">
            Export CSV
          </a>
          <form action={deleteWaitlistAction}>
            <input type="hidden" name="id" value={w.id} />
            <button type="submit" className="a-link a-muted">
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
        <h2 className="a-stat-l mb-3" style={{ fontSize: "0.75rem" }}>
          Signups
        </h2>
        {signups.length === 0 ? (
          <p className="a-sub">No signups yet. Share the page URL above to start the line.</p>
        ) : (
          <div className="a-card a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Face</th>
                  <th>Email</th>
                  <th>Referrals</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono a-muted">{s.position}</td>
                    <td>
                      <span className="a-table-av">
                        <QueueAvatar avatar={s.avatar} earned={s.earned} />
                      </span>
                    </td>
                    <td>{s.email}</td>
                    <td className="font-mono">{s.referralCount}</td>
                    <td className="a-muted">{s.createdAt.toISOString().slice(0, 10)}</td>
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
