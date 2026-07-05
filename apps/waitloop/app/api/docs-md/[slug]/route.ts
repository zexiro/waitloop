import { readDoc } from "@/lib/docs";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const md = await readDoc(slug);
  if (!md) return new Response("not found", { status: 404 });
  return new Response(md, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
