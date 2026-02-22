import { NextResponse } from "next/server";
import { getLatestArticles } from "@/lib/content";

export async function GET() {
  const data = getLatestArticles();
  if (!data) {
    return NextResponse.json({ tags: [] });
  }

  const counts: Record<string, number> = {};
  for (const article of data.articles) {
    for (const tag of article.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  // Sort: top-level first, then alphabetically within each level
  const tags = Object.entries(counts)
    .map(([tag, count]) => ({ tag, count, depth: tag.split("/").length }))
    .sort((a, b) => {
      // Primary: alphabetical by full tag path (groups hierarchy together)
      const cmp = a.tag.localeCompare(b.tag);
      if (cmp !== 0) return cmp;
      return 0;
    });

  return NextResponse.json({
    date: data.date,
    tags: tags.map(({ tag, count }) => ({ tag, count })),
  });
}
