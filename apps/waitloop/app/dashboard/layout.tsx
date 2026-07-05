import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

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
      <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
