import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { billingNotice } from "@/lib/entitlements";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const notice = await billingNotice(user);

  return (
    <div className="q-scope min-h-dvh">
      <header className="a-header">
        <nav className="a-nav">
          <Link href="/dashboard" className="l-logo">
            wait<span>loop</span>
          </Link>
          <Link href="/dashboard">Waitlists</Link>
          <Link href="/dashboard/keys">API keys</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="a-muted font-mono text-xs">{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="a-link">
              Log out
            </button>
          </form>
        </div>
      </header>
      {notice ? (
        <div className={`a-notice${notice.tone === "warning" ? " a-notice--warning" : ""}`}>
          <span>{notice.message}</span>
          <a href={notice.actionUrl}>{notice.actionLabel}</a>
        </div>
      ) : null}
      <main className="a-main">{children}</main>
    </div>
  );
}
