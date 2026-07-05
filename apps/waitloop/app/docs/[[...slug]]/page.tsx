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
    <div className="min-h-dvh" style={{ background: "var(--ink)", color: "var(--text-on-ink)" }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--ink-line)" }}
      >
        <Link href="/" className="font-mono font-semibold tracking-wide text-sm">
          <span style={{ color: "var(--accent)" }}>●</span> waitloop
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <a href={`/docs/${slug}.md`} className="font-mono text-xs opacity-60 hover:opacity-100">
            view as .md
          </a>
          <a href="/llms.txt" className="font-mono text-xs opacity-60 hover:opacity-100">
            llms.txt
          </a>
          <Link href="/login" className="opacity-80 hover:opacity-100">
            Log in
          </Link>
        </nav>
      </header>
      <div className="max-w-5xl mx-auto flex gap-10 px-6 py-10">
        <aside className="w-44 shrink-0 hidden md:block">
          <nav className="flex flex-col gap-2 text-sm sticky top-10">
            {docs.map((d) => (
              <Link
                key={d.slug}
                href={d.slug === "index" ? "/docs" : `/docs/${d.slug}`}
                className={slug === d.slug ? "font-semibold" : "opacity-60 hover:opacity-100"}
                style={slug === d.slug ? { color: "var(--accent)" } : undefined}
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
