import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export const DOC_ORDER = ["index", "mcp", "cli", "api", "webhooks", "embed", "self-hosting"];

export async function listDocs() {
  const files = await readdir(DOCS_DIR);
  const slugs = files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
  slugs.sort((a, b) => {
    const ia = DOC_ORDER.indexOf(a);
    const ib = DOC_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return Promise.all(
    slugs.map(async (slug) => {
      const md = await readDoc(slug);
      return { slug, title: docTitle(md!) };
    }),
  );
}

export async function readDoc(slug: string): Promise<string | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await readFile(path.join(DOCS_DIR, `${slug}.md`), "utf8");
  } catch {
    return null;
  }
}

export function docTitle(md: string) {
  return md.match(/^#\s+(.+)$/m)?.[1] ?? "Untitled";
}
