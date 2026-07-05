import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQueueFront, getWaitlistBySlug } from "@/lib/waitlists";
import { QueueAvatar } from "@/components/queue-avatar";
import { SignupForm } from "./signup-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWaitlistBySlug(slug);
  if (!w) return { title: "Not found" };
  return {
    title: w.theme.headline ?? w.name,
    description: w.theme.description ?? `Join the waitlist for ${w.name}.`,
  };
}

export default async function WaitlistPage({ params }: Props) {
  const { slug } = await params;
  const w = await getWaitlistBySlug(slug);
  if (!w) notFound();
  const queue = await getQueueFront(w, 8);

  const scheme = w.theme.background ?? "light";
  const accent = w.theme.accentColor;

  return (
    <div
      className="q-scope q-page"
      data-scheme={scheme}
      style={accent ? ({ "--q-accent": accent } as React.CSSProperties) : undefined}
    >
      <main className="q-page-main">
        <span className="q-kicker">
          <span className="q-live-dot" aria-hidden />
          {queue.total > 0 ? `${queue.total.toLocaleString()} in line` : "the line is open"}
        </span>
        {w.theme.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={w.theme.logoUrl} alt={`${w.name} logo`} className="q-logo-img" />
        ) : null}
        <h1 className="q-display q-headline">{w.theme.headline ?? w.name}</h1>
        {w.theme.description ? <p className="q-desc">{w.theme.description}</p> : null}
        <SignupForm
          slug={w.slug}
          buttonText={w.theme.buttonText ?? "Join the waitlist"}
          successMessage={w.theme.successMessage ?? "You're in!"}
          referralsEnabled={w.referralsEnabled}
          avatarsEnabled={w.avatarsEnabled}
        />
        {w.avatarsEnabled && queue.front.length > 0 ? (
          <div>
            <div className="q-queue" aria-label="The front of the queue">
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
              <div className="q-door">{w.name}</div>
            </div>
            <p className="q-queue-caption">
              The front of the line right now
              {w.referralsEnabled ? " — bring friends to move up" : ""}.
            </p>
          </div>
        ) : null}
      </main>
      <footer className="q-page-footer">
        powered by <a href="/">waitloop</a>
      </footer>
    </div>
  );
}
