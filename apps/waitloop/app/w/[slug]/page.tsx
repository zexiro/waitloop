import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStats, getWaitlistBySlug } from "@/lib/waitlists";
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
  const stats = await getStats(w);

  const scheme = w.theme.background ?? "dark";
  const accent = w.theme.accentColor;

  return (
    <div
      className="wl-page"
      data-scheme={scheme}
      style={accent ? ({ "--wl-accent": accent } as React.CSSProperties) : undefined}
    >
      <main className="wl-main">
        <div className="wl-eyebrow">
          <span className="wl-dot" aria-hidden />
          <span>
            {stats.total > 0
              ? `${stats.total.toLocaleString()} in line`
              : "the line is open"}
          </span>
        </div>
        {w.theme.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={w.theme.logoUrl} alt={`${w.name} logo`} className="wl-logo" />
        ) : null}
        <h1 className="wl-headline">{w.theme.headline ?? w.name}</h1>
        {w.theme.description ? <p className="wl-description">{w.theme.description}</p> : null}
        <SignupForm
          slug={w.slug}
          buttonText={w.theme.buttonText ?? "Join the waitlist"}
          successMessage={w.theme.successMessage ?? "You're on the list."}
          referralsEnabled={w.referralsEnabled}
        />
      </main>
      <footer className="wl-footer">
        powered by <a href="/">waitloop</a>
      </footer>
    </div>
  );
}
