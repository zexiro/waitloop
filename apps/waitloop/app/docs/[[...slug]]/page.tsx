import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { docTitle, listDocs, readDoc } from "@/lib/docs";

// Docs are read from disk and reference APP_URL — render at request time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const md = await readDoc(slug?.[0] ?? "index");
  return { title: md ? `${docTitle(md)} — Waitloop docs` : "Not found" };
}

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug: parts } = await params;
  if (parts && parts.length > 1) notFound();
  const slug = parts?.[0] ?? "index";
  const md = await readDoc(slug);
  if (!md) notFound();
  const [docs, html] = await Promise.all([listDocs(), marked.parse(md)]);

  return (
    <div className="q-scope min-h-dvh">
      <header className="a-header">
        <nav className="a-nav">
          <Link href="/" className="l-logo">
            wait<span>loop</span>
          </Link>
          <span className="a-muted text-sm font-bold">docs</span>
        </nav>
        <nav className="flex items-center gap-5 text-sm">
          <a href={`/docs/${slug}.md`} className="a-link font-mono" style={{ fontSize: "0.75rem" }}>
            view as .md
          </a>
          <a href="/llms.txt" className="a-link font-mono" style={{ fontSize: "0.75rem" }}>
            llms.txt
          </a>
          <Link href="/login" className="q-btn q-btn--sm" style={{ textDecoration: "none" }}>
            Log in
          </Link>
        </nav>
      </header>
      <div className="max-w-5xl mx-auto flex gap-10 px-6 py-10">
        <aside className="w-44 shrink-0 hidden md:block">
          <nav className="flex flex-col gap-2 text-sm sticky top-10 font-semibold">
            {docs.map((d) => (
              <Link
                key={d.slug}
                href={d.slug === "index" ? "/docs" : `/docs/${d.slug}`}
                className={d.slug === slug ? "font-bold" : "a-muted hover:opacity-100"}
                style={d.slug === slug ? { color: "var(--q-accent-deep)" } : undefined}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </aside>
        <article
          className="docs-prose min-w-0 flex-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
