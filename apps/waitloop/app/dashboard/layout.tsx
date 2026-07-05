import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { billingNotice } from "@/lib/entitlements";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const notice = await billingNotice(user);

  return (
    <div className="min-h-dvh" style={{ background: "var(--ink)", color: "var(--text-on-ink)" }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--ink-line)" }}
      >
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="font-mono font-semibold tracking-wide">
            <span style={{ color: "var(--accent)" }}>●</span> waitloop
          </Link>
          <Link href="/dashboard" className="opacity-80 hover:opacity-100">
            Waitlists
          </Link>
          <Link href="/dashboard/keys" className="opacity-80 hover:opacity-100">
            API keys
          </Link>
          <Link href="/docs" className="opacity-80 hover:opacity-100">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-60 font-mono text-xs">{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="opacity-80 hover:opacity-100 cursor-pointer">
              Log out
            </button>
          </form>
        </div>
      </header>
      {notice ? (
        <div
          className="px-6 py-2.5 text-sm flex items-center justify-center gap-3 border-b"
          style={{
            borderColor: "var(--ink-line)",
            background: notice.tone === "warning" ? "rgba(255,107,61,0.12)" : "var(--ink-surface)",
          }}
        >
          <span>{notice.message}</span>
          <a
            href={notice.actionUrl}
            className="underline underline-offset-4 font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {notice.actionLabel}
          </a>
        </div>
      ) : null}
      <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
