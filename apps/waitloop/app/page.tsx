import Link from "next/link";
import { appUrl } from "@/lib/auth";
import { getOrCreateDemoWaitlist } from "@/lib/demo";
import { getStats } from "@/lib/waitlists";

// APP_URL is a runtime setting for self-hosters — don't bake it in at build.
export const dynamic = "force-dynamic";

const steps = [
  {
    n: "01",
    title: "Connect once",
    body: "Add the Waitloop MCP server to Claude, Cursor, or any MCP client — or use the CLI and REST API directly. One API key unlocks all three.",
  },
  {
    n: "02",
    title: "One tool call",
    body: "create_waitlist returns a live hosted page with email capture and referral ranking. No dashboard visit required, ever.",
  },
  {
    n: "03",
    title: "The line grows itself",
    body: "Every signup gets a referral link that moves them up the queue. Your agent watches stats, exports the list, and pings your webhook on every signup.",
  },
];

const features: [string, string][] = [
  ["Referral ranking", "Signups climb the list by inviting others. Positions update live."],
  ["Hosted pages", "Themeable dark/light pages with your copy, logo, and accent color."],
  ["MCP + CLI + API", "Eight MCP tools, JSON-first CLI, and a plain REST API."],
  ["Webhooks", "POST on every signup — pipe the line into anything."],
  ["CSV export", "Your list is yours. One call, full export."],
  ["Embed widget", "One script tag drops the form into any site."],
];

export default async function Home() {
  const demo = await getOrCreateDemoWaitlist();
  const demoStats = await getStats(demo);
  const MCP_SNIPPET = `$ claude mcp add --transport http waitloop \\
    ${appUrl()}/api/mcp \\
    --header "Authorization: Bearer wl_..."

> create a waitlist for my new CLI tool, dark page,
  orange accent, headline "Ship faster with agents"

● waitloop  create_waitlist(...)
  ✓ live at ${appUrl()}/w/ship-faster`;

  return (
    <div className="min-h-dvh" style={{ background: "var(--ink)", color: "var(--text-on-ink)" }}>
      <header className="max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
        <span className="font-mono font-semibold tracking-wide text-sm">
          <span style={{ color: "var(--accent)" }}>●</span> waitloop
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#demo" className="opacity-80 hover:opacity-100">
            Live demo
          </a>
          <Link href="/docs" className="opacity-80 hover:opacity-100">
            Docs
          </Link>
          <a href="https://github.com/zexiro/waitloop" className="opacity-80 hover:opacity-100">
            GitHub
          </a>
          <Link
            href="/login"
            className="wl-button"
            style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem", borderRadius: "0.4rem", textDecoration: "none" }}
          >
            Get an API key
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 items-start">
            <div className="wl-eyebrow">
              <span className="wl-dot" aria-hidden />
              <span>agent-first waitlists</span>
            </div>
            <h1
              className="text-5xl font-extrabold tracking-tight leading-[1.02]"
              style={{ fontStretch: "112%", textWrap: "balance" }}
            >
              Waitlists your agent can launch
            </h1>
            <p className="text-lg opacity-70 max-w-md leading-relaxed">
              A hosted waitlist page with referral ranking, created by one MCP tool call. Built for
              the way software ships now: your agent builds the product — Waitloop starts the line.
            </p>
            <div className="flex gap-3 items-center">
              <Link href="/login" className="wl-button" style={{ textDecoration: "none" }}>
                Start free
              </Link>
              <Link
                href="/docs"
                className="text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
              >
                Read the docs
              </Link>
            </div>
          </div>
          <pre
            className="font-mono text-[13px] leading-relaxed rounded-lg border p-5 overflow-x-auto"
            style={{ borderColor: "var(--ink-line)", background: "var(--ink-surface)" }}
          >
            {MCP_SNIPPET}
          </pre>
        </section>

        {/* live demo */}
        <section id="demo" className="py-14 border-t" style={{ borderColor: "var(--ink-line)" }}>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                This is what a Waitloop page looks like
              </h2>
              <p className="text-sm opacity-70 mt-2 max-w-xl leading-relaxed">
                A real, live waitlist below — for a fictional lunar coffee machine. Join it with any
                email: you&apos;ll get your place in line and a referral link that moves you up when
                someone joins through it. {demoStats.total.toLocaleString()} people are in line so
                far.
              </p>
            </div>
            <a
              href={`/w/${demo.slug}`}
              target="_blank"
              className="font-mono text-sm underline underline-offset-4 opacity-80 hover:opacity-100 shrink-0"
            >
              open full page ↗
            </a>
          </div>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--ink-line)" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b font-mono text-xs opacity-60"
              style={{ borderColor: "var(--ink-line)", background: "var(--ink-surface)" }}
            >
              <span className="flex gap-1.5" aria-hidden>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--ink-line)" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--ink-line)" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--ink-line)" }} />
              </span>
              <span className="mx-auto">
                {appUrl().replace(/^https?:\/\//, "")}/w/{demo.slug}
              </span>
            </div>
            <iframe
              src={`/w/${demo.slug}`}
              title="Live demo waitlist — Moonbase Espresso"
              className="w-full block"
              style={{ height: "560px", border: "0", background: "#faf8f4" }}
            />
          </div>
          <p className="font-mono text-xs opacity-50 mt-3">
            created the same way yours would be: one create_waitlist call — custom headline, copy,
            accent color, light background
          </p>
        </section>

        <section className="py-14 border-t" style={{ borderColor: "var(--ink-line)" }}>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.n}>
                <div className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>
                  {s.n}
                </div>
                <h2 className="font-bold text-lg mb-2">{s.title}</h2>
                <p className="text-sm opacity-70 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-14 border-t" style={{ borderColor: "var(--ink-line)" }}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map(([title, body]) => (
              <div
                key={title}
                className="rounded-lg border p-5"
                style={{ borderColor: "var(--ink-line)", background: "var(--ink-surface)" }}
              >
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm opacity-70 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="py-14 border-t flex flex-col items-start gap-4"
          style={{ borderColor: "var(--ink-line)" }}
        >
          <h2 className="text-2xl font-extrabold tracking-tight">Open source, self-hostable</h2>
          <p className="opacity-70 max-w-xl leading-relaxed text-sm">
            AGPL-licensed. Run the whole thing on your own box with{" "}
            <code className="font-mono">docker compose up</code> — the hosted cloud exists so you
            don&apos;t have to.
          </p>
          <a
            href="https://github.com/zexiro/waitloop"
            className="font-mono text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            github.com/zexiro/waitloop →
          </a>
        </section>
      </main>

      <footer
        className="border-t mt-10 py-8 text-center font-mono text-xs opacity-50"
        style={{ borderColor: "var(--ink-line)" }}
      >
        waitloop — an agent-first product
      </footer>
    </div>
  );
}
