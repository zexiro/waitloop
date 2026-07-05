import Link from "next/link";
import { appUrl } from "@/lib/auth";
import { getOrCreateDemoWaitlist } from "@/lib/demo";
import { getQueueFront } from "@/lib/waitlists";
import { QueueAvatar } from "@/components/queue-avatar";
import type { Avatar } from "@/lib/avatars";

// APP_URL is a runtime setting for self-hosters — don't bake it in at build.
export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Connect once",
    body: "Add the Waitloop MCP server to Claude, Cursor, or any MCP client — or use the CLI and REST API directly. One API key unlocks all three.",
  },
  {
    title: "One tool call",
    body: "create_waitlist returns a live hosted page with email capture and referral ranking. No dashboard visit required, ever.",
  },
  {
    title: "The line grows itself",
    body: "Every signup gets a referral link that moves them up the queue. Your agent watches stats, exports the list, and pings your webhook on every signup.",
  },
];

const features: [string, string][] = [
  ["#ff7bac", "One MCP call to launch"],
  ["#57c785", "Referrals move you up"],
  ["#ffa94d", "Hosted page, your colors"],
  ["#6aa9e9", "Webhooks + CSV export"],
  ["#b5aef0", "Embed widget"],
  ["#ffd166", "Open source, self-host"],
];

const earned: { face: Avatar; item: "crown" | "balloon" | "pennant" | "glow"; name: string; how: React.ReactNode }[] = [
  {
    face: { expression: "grin", accessory: "none", color: "#ffd166" },
    item: "crown",
    name: "The Crown",
    how: (
      <>
        Hold <b>#1</b>. Get overtaken, lose it — publicly.
      </>
    ),
  },
  {
    face: { expression: "smile", accessory: "none", color: "#9ecbf5" },
    item: "balloon",
    name: "Balloon",
    how: (
      <>
        Bring your <b>first friend</b> through your link.
      </>
    ),
  },
  {
    face: { expression: "joy", accessory: "none", color: "#ffa1c3" },
    item: "pennant",
    name: "Pennant",
    how: (
      <>
        Bring <b>5 friends</b>. You&apos;re leading a crowd now.
      </>
    ),
  },
  {
    face: { expression: "starry", accessory: "none", color: "#b5aef0" },
    item: "glow",
    name: "Golden Glow",
    how: (
      <>
        Bring <b>10 friends</b>. Everyone in line can see it.
      </>
    ),
  },
];

export default async function Home() {
  const demo = await getOrCreateDemoWaitlist();
  const queue = await getQueueFront(demo, 8);
  const MCP_SNIPPET = `$ claude mcp add --transport http waitloop \\
    ${appUrl()}/api/mcp \\
    --header "Authorization: Bearer wl_..."

> create a waitlist for my new CLI tool,
  headline "Ship faster with agents"

● waitloop  create_waitlist(...)
  ✓ live at ${appUrl()}/w/ship-faster`;

  return (
    <div className="q-scope" style={{ minHeight: "100dvh" }}>
      <div className="l-shell">
        <header className="l-nav">
          <Link href="/" className="l-logo">
            wait<span>loop</span>
          </Link>
          <nav className="l-nav-links">
            <a href="#demo">Live demo</a>
            <Link href="/docs">Docs</Link>
            <a href="https://github.com/zexiro/waitloop">GitHub</a>
            <Link href="/login" className="q-btn">
              Start free
            </Link>
          </nav>
        </header>

        <section className="l-hero">
          <span className="q-kicker">
            <span className="q-live-dot" aria-hidden />
            Built for agents · loved by humans
          </span>
          <h1 className="q-display">
            A line people are <mark>happy</mark> to stand in.
          </h1>
          <p className="l-sub">
            Ask your agent for a waitlist and get a page people actually want to share. Everyone
            in line gets a face, a referral link, and a reason to bring friends — positions
            update live. Launch day, you open the doors to a crowd.
          </p>
          <div className="l-hero-actions">
            <Link href="/login" className="q-btn">
              Start your line — free for 7 days
            </Link>
            <a href="#demo" className="q-link">
              Peek at a live one
            </a>
          </div>
          {queue.front.length > 0 ? (
            <div style={{ width: "100%" }}>
              <div className="q-queue" aria-label="The front of the demo waitlist queue">
                {queue.total > queue.front.length ? (
                  <span className="q-more">
                    +{(queue.total - queue.front.length).toLocaleString()} more
                  </span>
                ) : null}
                {[...queue.front].reverse().map((entry) => (
                  <div className="q-av" key={entry.position}>
                    <QueueAvatar avatar={entry.avatar} earned={entry.earned} />
                    <span className="q-pos">#{entry.position}</span>
                  </div>
                ))}
                <div className="q-door">{demo.name}</div>
              </div>
              <p className="q-queue-caption">
                Not a mockup — the actual front of the demo line below. The crown belongs to
                whoever holds #1.
              </p>
            </div>
          ) : null}
        </section>

        <section className="l-section" id="demo">
          <div className="l-section-head">
            <h2 className="q-display">This is what a Waitloop page looks like</h2>
            <p>
              A real, live waitlist for a fictional lunar coffee machine. Join it with any email:
              you&apos;ll get your place in line, a queue avatar you can dress up, and a referral
              link that moves you up when someone joins through it.
            </p>
          </div>
          <div className="q-card l-browser">
            <div className="l-browser-bar" aria-hidden>
              <i />
              <i />
              <i />
              <span>
                {appUrl().replace(/^https?:\/\//, "")}/w/{demo.slug}
              </span>
            </div>
            <iframe src={`/w/${demo.slug}`} title="Live demo waitlist — Moonbase Espresso" />
          </div>
          <p className="q-queue-caption">
            Created the same way yours would be: one create_waitlist call.{" "}
            <a className="q-link" href={`/w/${demo.slug}`} target="_blank">
              Open the full page ↗
            </a>
          </p>
        </section>

        <section className="l-section">
          <div className="l-section-head">
            <h2 className="q-display">Earned, not picked</h2>
            <p>
              Signups choose their queue face — expression, accessory, color. But some things the
              queue hands out itself, and losing one stings just enough to make people share.
            </p>
          </div>
          <div className="l-earned-grid">
            {earned.map((e) => (
              <div className="q-card l-earned-card" key={e.item}>
                <QueueAvatar avatar={e.face} earned={[e.item]} />
                <h3 className="q-display">{e.name}</h3>
                <p>{e.how}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="l-section">
          <div className="l-section-head">
            <h2 className="q-display">Launch a line in one tool call</h2>
          </div>
          <div className="l-steps">
            {steps.map((s) => (
              <div className="q-card l-step" key={s.title}>
                <h3 className="q-display">{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="l-section">
          <div className="l-agent-card">
            <div>
              <h2 className="q-display">Your agent builds the product. Waitloop starts the line.</h2>
              <p>
                Eight MCP tools, a JSON-first CLI, and a plain REST API. Create pages, add
                signups, watch stats, export CSV — without opening a dashboard.
              </p>
              <Link href="/docs" className="q-btn">
                Read the docs
              </Link>
            </div>
            <pre>{MCP_SNIPPET}</pre>
          </div>
        </section>

        <section className="l-section">
          <div className="l-pills">
            {features.map(([color, label]) => (
              <span className="l-pill" key={label}>
                <i style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </section>

        <footer className="l-footer">
          waitloop — an agent-first product · AGPL open source ·{" "}
          <a href="https://github.com/zexiro/waitloop">
            run the whole thing yourself with docker compose up
          </a>
        </footer>
      </div>
    </div>
  );
}
